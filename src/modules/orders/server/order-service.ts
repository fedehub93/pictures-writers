import "server-only";

import { TRPCError } from "@trpc/server";

import {
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@/generated/prisma";

import { db } from "@/shared/lib/db";

const ORDER_NUMBER_PREFIX = "PW";

type DbClient = typeof db | Prisma.TransactionClient;

export const orderInclude = {
  customer: { select: { id: true, email: true, name: true } },
  items: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderRecordInput {
  customerId: string;
  items: CreateOrderItemInput[];
  notes?: string | null;
  /** Who/what created the order. `MANUAL` for the admin form, `AUTOMATION` for nodes. */
  source: OrderSource;
  /** Lifecycle state at creation. The admin form starts DRAFT, automations start PENDING. */
  status: OrderStatus;
}

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

const buildItems = async (items: CreateOrderItemInput[]) => {
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

/**
 * Single creation path for an Order, shared by the admin router and the
 * automation `CREATE_ORDER` node so numbering, price snapshots, the line items
 * and the pending offline Payment never drift between the two callers.
 */
export async function createOrderRecord(
  input: CreateOrderRecordInput,
): Promise<OrderWithRelations> {
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
            status: input.status,
            source: input.source,
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
}
