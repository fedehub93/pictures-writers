import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

import { createCallerFactory } from "@/trpc/init";

import { OrderStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { ordersRouter } from "../server/procedures";

const createCaller = createCallerFactory(ordersRouter);
const customerIds: string[] = [];
const orderIds: string[] = [];

async function createOrder(status: OrderStatus, totalAmount = 100) {
  const customer = await db.customer.create({
    data: { email: `customer-${randomUUID()}@example.com`, name: "Mario Rossi" },
  });
  customerIds.push(customer.id);

  const order = await db.order.create({
    data: {
      orderNumber: `PW-TEST-${randomUUID().slice(0, 8)}`,
      status,
      customerId: customer.id,
      totalAmount,
      currency: "EUR",
    },
  });
  orderIds.push(order.id);

  return { order, customer };
}

beforeEach(() => {
  customerIds.length = 0;
  orderIds.length = 0;
});

afterEach(async () => {
  if (orderIds.length > 0) {
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
  }
  if (customerIds.length > 0) {
    await db.customer.deleteMany({ where: { id: { in: customerIds } } });
  }
  customerIds.length = 0;
  orderIds.length = 0;
});

describe("orders.getPendingOrders", () => {
  it("counts and lists pending orders only, with the customer name", async () => {
    const pending = await createOrder(OrderStatus.PENDING, 250);
    await createOrder(OrderStatus.DRAFT, 10);
    await createOrder(OrderStatus.COMPLETED, 10);

    const result = await createCaller({
      userId: "any-user",
    }).getPendingOrders();

    expect(result.count).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(pending.order.id);
    expect(result.items[0]?.totalAmount).toBe(250);
    expect(result.items[0]?.customerName).toBe("Mario Rossi");
  });
});
