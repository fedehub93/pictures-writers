import "server-only";

import { TRPCError } from "@trpc/server";
import z from "zod";

import {
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@/generated/prisma";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/authorization";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import { orderInsertSchema, orderListSchema } from "../schemas";
import { emitOrderCompleted } from "../automations/emit";
import {
  createOrderRecord,
  orderInclude,
  OrderCustomerNotFoundError,
  OrderNumberGenerationError,
  OrderProductNotFoundError,
} from "./order-service";

const toTRPCError = (error: unknown): never => {
  if (error instanceof OrderCustomerNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: error.message });
  }
  if (error instanceof OrderProductNotFoundError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  }
  if (error instanceof OrderNumberGenerationError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }
  throw error;
};

// The allowed lifecycle transitions live in a single place so new states can be
// added safely. COMPLETED and CANCELLED are terminal.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PENDING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

const assertTransition = (from: OrderStatus, to: OrderStatus) => {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Cannot move an order from ${from} to ${to}.`,
    });
  }
};

/**
 * Applies a transition atomically: the update only matches when the order is
 * still in the status we inspected, so two concurrent transitions cannot both
 * win.
 */
const transitionOrThrow = async (
  id: string,
  from: OrderStatus,
  to: OrderStatus,
) => {
  const result = await db.order.updateMany({
    where: { id, status: from },
    data: { status: to },
  });

  if (result.count === 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "The order changed while updating it. Reload and try again.",
    });
  }
};

const findOrderOrThrow = async (id: string) => {
  const order = await db.order.findUnique({ where: { id } });
  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  }
  return order;
};

export const ordersRouter = createTRPCRouter({
  create: permissionProcedure(PERMISSIONS.ORDERS_CREATE)
    .input(orderInsertSchema)
    .mutation(async ({ input }) => {
      try {
        return await createOrderRecord({
          customerId: input.customerId,
          items: input.items,
          notes: input.notes,
          orderDate: input.orderDate,
          source: OrderSource.MANUAL,
          status: OrderStatus.DRAFT,
        });
      } catch (error) {
        return toTRPCError(error);
      }
    }),

  getMany: permissionProcedure(PERMISSIONS.ORDERS_READ)
    .input(orderListSchema)
    .query(async ({ input }) => {
      const search = input.search?.trim();
      const where: Prisma.OrderWhereInput = {
        status: input.status ?? undefined,
        ...(search
          ? {
              OR: [
                {
                  orderNumber: { contains: search, mode: "insensitive" },
                },
                {
                  customer: {
                    email: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  customer: {
                    name: { contains: search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        db.order.findMany({
          where,
          include: {
            customer: { select: { id: true, email: true, name: true } },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
        }),
        db.order.count({ where }),
      ]);

      return {
        items,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  getOne: permissionProcedure(PERMISSIONS.ORDERS_READ)
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const order = await db.order.findUnique({
        where: { id: input.id },
        include: orderInclude,
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }

      return order;
    }),

  getFormOptions: permissionProcedure(PERMISSIONS.ORDERS_CREATE).query(
    async () => {
      const [customers, products] = await Promise.all([
        db.customer.findMany({
          select: { id: true, email: true, name: true },
          orderBy: { email: "asc" },
        }),
        db.productRoot.findMany({
          where: { liveVersion: { isNot: null } },
          select: {
            id: true,
            liveVersion: { select: { title: true, price: true } },
          },
          orderBy: { liveVersion: { title: "asc" } },
        }),
      ]);

      const productOptions = products
        .filter((root) => Boolean(root.liveVersion))
        .map((root) => ({
          id: root.id,
          title: root.liveVersion!.title,
          price: root.liveVersion!.price,
        }));

      return { customers, products: productOptions };
    },
  ),

  confirm: permissionProcedure(PERMISSIONS.ORDERS_UPDATE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const order = await findOrderOrThrow(input.id);
      assertTransition(order.status, OrderStatus.PENDING);
      await transitionOrThrow(input.id, order.status, OrderStatus.PENDING);

      return db.order.findUniqueOrThrow({
        where: { id: input.id },
        include: orderInclude,
      });
    }),

  complete: permissionProcedure(PERMISSIONS.ORDERS_MANAGE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const order = await findOrderOrThrow(input.id);
      assertTransition(order.status, OrderStatus.COMPLETED);

      const now = new Date();

      const completed = await db.$transaction(async (transaction) => {
        const result = await transaction.order.updateMany({
          where: { id: order.id, status: OrderStatus.PENDING },
          data: {
            status: OrderStatus.COMPLETED,
            completedAt: now,
            completedBy: ctx.auth.id,
          },
        });

        if (result.count === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "The order changed while completing it. Reload and try again.",
          });
        }

        await transaction.payment.updateMany({
          where: {
            orderId: order.id,
            method: PaymentMethod.OFFLINE,
            status: PaymentStatus.PENDING,
          },
          data: { status: PaymentStatus.COMPLETED, paidAt: now },
        });

        return transaction.order.findUniqueOrThrow({
          where: { id: order.id },
          include: orderInclude,
        });
      });

      // Completion is the canonical post-purchase moment: emit the internal
      // trigger so subscribed automations start. An emit failure must never
      // roll back a completed sale.
      try {
        await emitOrderCompleted({
          id: completed.id,
          orderNumber: completed.orderNumber,
          customerId: completed.customerId,
          customerEmail: completed.customer.email,
          totalAmount: completed.totalAmount,
          currency: completed.currency,
          completedAt: completed.completedAt,
          items: completed.items,
        });
      } catch (error) {
        console.error("[ORDERS] Failed to emit order.completed", error);
      }

      return completed;
    }),

  cancel: permissionProcedure(PERMISSIONS.ORDERS_MANAGE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const order = await findOrderOrThrow(input.id);
      assertTransition(order.status, OrderStatus.CANCELLED);
      await transitionOrThrow(input.id, order.status, OrderStatus.CANCELLED);

      return db.order.findUniqueOrThrow({
        where: { id: input.id },
        include: orderInclude,
      });
    }),
});
