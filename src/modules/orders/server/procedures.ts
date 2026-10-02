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

const ORDER_NUMBER_PREFIX = "PW";

type DbClient = typeof db | Prisma.TransactionClient;

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

const formatOrderNumber = (year: number, sequence: number) =>
  `${ORDER_NUMBER_PREFIX}-${year}-${String(sequence).padStart(6, "0")}`;
const nextOrderNumber = async (client: DbClient, year: number) => {
  const prefix = `${ORDER_NUMBER_PREFIX}-${year}-`;
  const last = await client.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const lastSequence = last
    ? Number.parseInt(last.orderNumber.slice(prefix.length), 10)
    : 0;

  return formatOrderNumber(
    year,
    (Number.isNaN(lastSequence) ? 0 : lastSequence) + 1,
  );
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

const toNullable = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const orderInclude = {
  customer: { select: { id: true, email: true, name: true } },
  items: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.OrderInclude;

const findOrderOrThrow = async (id: string) => {
  const order = await db.order.findUnique({ where: { id } });
  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  }
  return order;
};

const buildItems = async (items: { productId: string; quantity: number }[]) => {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "One or more products were not found.",
    });
  }

  const productById = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productById.get(item.productId)!;
    const unitPrice = product.price ?? 0;
    const totalPrice = unitPrice * item.quantity;

    return {
      productId: product.id,
      nameSnapshot: product.title,
      unitPrice,
      quantity: item.quantity,
      totalPrice,
    };
  });
};

export const ordersRouter = createTRPCRouter({
  create: permissionProcedure(PERMISSIONS.ORDERS_CREATE)
    .input(orderInsertSchema)
    .mutation(async ({ input }) => {
      const customer = await db.customer.findUnique({
        where: { id: input.customerId },
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found.",
        });
      }

      const items = await buildItems(input.items);
      const totalAmount = items.reduce(
        (total, item) => total + item.totalPrice,
        0,
      );
      const year = new Date().getFullYear();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          return await db.$transaction(async (transaction) => {
            const orderNumber = await nextOrderNumber(transaction, year);

            return transaction.order.create({
              data: {
                orderNumber,
                customerId: customer.id,
                status: OrderStatus.DRAFT,
                source: OrderSource.MANUAL,
                totalAmount,
                notes: toNullable(input.notes),
                items: { create: items },
                payments: {
                  create: {
                    method: PaymentMethod.OFFLINE,
                    status: PaymentStatus.PENDING,
                    amount: totalAmount,
                  },
                },
              },
              include: orderInclude,
            });
          });
        } catch (error) {
          if (isUniqueConstraintError(error)) continue;
          throw error;
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not generate a unique order number.",
      });
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
        db.product.findMany({
          where: { isLatest: true },
          select: { id: true, title: true, price: true },
          orderBy: { title: "asc" },
        }),
      ]);

      return { customers, products };
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

      return db.$transaction(async (transaction) => {
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
