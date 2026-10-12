import "server-only";

import { OrderStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

import type { Metric } from "../../types";
import { buildRangeSeries } from "./series";

/**
 * Revenue / orders: sums `Order.totalAmount` of completed orders by their
 * completion moment (`completedAt`), bucketed by calendar month over the
 * requested range. Per the domain, order completion is the canonical business
 * moment for analytics, so drafts, pending, and cancelled orders are excluded.
 * Gated by the orders area permission.
 */
export const revenueMetric: Metric = {
  id: "revenue",
  label: "Revenue / orders",
  permission: PERMISSIONS.ORDERS_READ,
  timeSeries: (from, to) =>
    buildRangeSeries(from, to, async (start, end) => {
      const result = await db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: OrderStatus.COMPLETED,
          completedAt: { gte: start, lte: end },
        },
      });

      return result._sum.totalAmount ?? 0;
    }),
};
