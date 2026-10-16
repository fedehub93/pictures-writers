import { randomUUID } from "node:crypto";

import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OrderStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { revenueMetric } from "../metrics";

const customerIds: string[] = [];
const orderIds: string[] = [];

/** An anchor far outside any other suite's data, so the global totals stay deterministic. */
const anchor = new Date(2099, 0, 15, 12);

/** A local-time instant within the month `monthsAgo` before the anchor. */
const monthDate = (monthsAgo: number, day = 10) => {
  const base = subMonths(anchor, monthsAgo);
  return new Date(base.getFullYear(), base.getMonth(), day, 12);
};

async function createOrder(
  status: OrderStatus,
  totalAmount: number,
  completedAt: Date,
) {
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
      completedAt,
    },
  });
  orderIds.push(order.id);

  return order;
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

describe("revenue metric", () => {
  it("is gated by the orders area permission", () => {
    expect(revenueMetric.permission).toBe(PERMISSIONS.ORDERS_READ);
  });

  it("sums completed order totals by completion month, excluding unpaid states", async () => {
    await createOrder(OrderStatus.COMPLETED, 100, monthDate(0));
    await createOrder(OrderStatus.COMPLETED, 50, monthDate(0));
    // Pending, draft, and cancelled orders are not booked revenue.
    await createOrder(OrderStatus.PENDING, 999, monthDate(0));
    await createOrder(OrderStatus.DRAFT, 999, monthDate(0));
    await createOrder(OrderStatus.CANCELLED, 999, monthDate(0));
    await createOrder(OrderStatus.COMPLETED, 50, monthDate(1));

    const series = await revenueMetric.timeSeries(
      startOfMonth(subMonths(anchor, 1)),
      endOfMonth(anchor),
    );

    expect(series.points.map((point) => point.value)).toEqual([50, 150]);
    expect(series.total).toBe(200);
  });

  it("reports growth against the previous comparable period", async () => {
    await createOrder(OrderStatus.COMPLETED, 100, monthDate(0));
    await createOrder(OrderStatus.COMPLETED, 50, monthDate(1));

    const series = await revenueMetric.timeSeries(
      startOfMonth(anchor),
      endOfMonth(anchor),
    );

    expect(series.total).toBe(100);
    expect(series.percentageGrowth).toBe(100);
  });
});
