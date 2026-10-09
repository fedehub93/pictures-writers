import "server-only";

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

/**
 * Domain failures of the order creation path. The service stays free of any
 * transport concern; each caller translates these to its own error type (the
 * tRPC router to `TRPCError`, the automation node to `AutomationNodeError`).
 */
export class OrderCustomerNotFoundError extends Error {
  constructor() {
    super("Customer not found.");
    this.name = "OrderCustomerNotFoundError";
  }
}

export class OrderProductNotFoundError extends Error {
  constructor() {
    super("One or more products were not found.");
    this.name = "OrderProductNotFoundError";
  }
}

export class OrderNumberGenerationError extends Error {
  constructor() {
    super("Could not generate a unique order number.");
    this.name = "OrderNumberGenerationError";
  }
}

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
  /**
   * Business date of the sale. Defaults to now. Also drives the year segment of
   * the generated `orderNumber`, so historical orders are numbered in their own
   * year.
   */
  orderDate?: Date | null;
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
  const roots = await db.productRoot.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      liveVersion: { select: { title: true, price: true } },
    },
  });

  if (roots.length !== productIds.length) {
    throw new OrderProductNotFoundError();
  }

  const rootById = new Map(roots.map((root) => [root.id, root]));

  return items.map((item) => {
    const root = rootById.get(item.productId)!;
    const liveVersion = root.liveVersion;

    if (!liveVersion) {
      throw new OrderProductNotFoundError();
    }

    const unitPrice = liveVersion.price ?? 0;
    const totalPrice = unitPrice * item.quantity;

    return {
      productId: root.id,
      nameSnapshot: liveVersion.title,
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
    throw new OrderCustomerNotFoundError();
  }

  const items = await buildItems(input.items);
  const totalAmount = items.reduce(
    (total, item) => total + item.totalPrice,
    0,
  );
  const orderDate = input.orderDate ?? new Date();
  const year = orderDate.getFullYear();

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
            orderDate,
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

  throw new OrderNumberGenerationError();
}
