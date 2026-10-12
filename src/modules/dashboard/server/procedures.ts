import z from "zod";
import { TRPCError } from "@trpc/server";

import { getAuthorizedUser } from "@/shared/lib/authorization";
import { db } from "@/shared/lib/db";
import { hasPermission } from "@/shared/lib/permissions";
import { WIDGET_SIZES } from "@/shared/dashboard/types";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { getMetric, permittedMetrics } from "./metrics/registry";

const widgetInstanceSchema = z.object({
  key: z.string().min(1),
  definitionId: z.string().min(1),
  config: z.record(z.string(), z.unknown()).nullish(),
  size: z.enum(WIDGET_SIZES).optional(),
});

/** Loads the current user's authorization, failing the request when there is none. */
const requireUser = async (userId: string) => {
  const user = await getAuthorizedUser(userId);
  if (!user) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
  }
  return user;
};

export const dashboardRouter = createTRPCRouter({
  /**
   * The current user's saved layout. An empty list means the user has not added
   * any widget yet.
   */
  getLayout: protectedProcedure.query(async ({ ctx }) => {
    const layout = await db.dashboardLayout.findUnique({
      where: { userId: ctx.auth.id },
    });

    return { widgets: layout?.widgets ?? [] };
  }),

  /**
   * Persists the current user's layout override. Affects only the current
   * user.
   */
  saveLayout: protectedProcedure
    .input(z.object({ widgets: z.array(widgetInstanceSchema) }))
    .mutation(async ({ ctx, input }) => {
      const layout = await db.dashboardLayout.upsert({
        where: { userId: ctx.auth.id },
        create: { userId: ctx.auth.id, widgets: input.widgets },
        update: { widgets: input.widgets },
      });

      return { widgets: layout.widgets };
    }),

  /**
   * The metrics the current user may read, for the Trend widget. When this is
   * empty the user can read no metric, so the Trend has nothing to render and
   * hides itself.
   */
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const user = await requireUser(ctx.auth.id);

    return permittedMetrics((permission) =>
      hasPermission(user.permissionKeys, permission),
    ).map(({ id, label }) => ({ id, label }));
  }),

  /**
   * The time series of a single metric over a range, for one Trend instance.
   * Enforces the metric's own permission on top of `dashboard.read`, so a user
   * without the metric's permission never reads its data.
   */
  getMetricSeries: protectedProcedure
    .input(
      z.object({
        metricId: z.string(),
        from: z.iso.datetime({ message: "Invalid 'from' date format" }),
        to: z.iso.datetime({ message: "Invalid 'to' date format" }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const metric = getMetric(input.metricId);
      const user = await requireUser(ctx.auth.id);

      if (!metric || !hasPermission(user.permissionKeys, metric.permission)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
      }

      return metric.timeSeries(new Date(input.from), new Date(input.to));
    }),
});
