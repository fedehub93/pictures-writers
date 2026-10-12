import z from "zod";
import { TRPCError } from "@trpc/server";

import {
  AutomationRunStatus,
  ContentStatus,
  OrderStatus,
  Prisma,
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";
import { getAuthorizedUser } from "@/shared/lib/authorization";
import { db } from "@/shared/lib/db";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
} from "@/trpc/init";

import { getMetric, permittedMetrics } from "./metrics/registry";

/** How many records each operational widget lists at once. */
const LIST_LIMIT = 5;

const widgetInstanceSchema = z.object({
  key: z.string().min(1),
  definitionId: z.string().min(1),
  config: z.record(z.string(), z.unknown()).nullish(),
  hidden: z.boolean().optional(),
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
   * The current user's saved layout override. An empty list means "no override
   * yet", so the registry defaults apply.
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
   * Draft posts: the count and the most recently edited few, for the
   * "Bozze da pubblicare" widget.
   */
  getDrafts: permissionProcedure(PERMISSIONS.POSTS_READ).query(async () => {
    const where: Prisma.PostRootWhereInput = {
      currentVersion: { is: { status: ContentStatus.DRAFT } },
    };

    const [roots, count] = await Promise.all([
      db.postRoot.findMany({
        where,
        orderBy: { currentVersion: { updatedAt: "desc" } },
        take: LIST_LIMIT,
        select: {
          id: true,
          slug: true,
          currentVersion: {
            select: { id: true, title: true, updatedAt: true },
          },
        },
      }),
      db.postRoot.count({ where }),
    ]);

    const items = roots
      .map((root) => {
        const version = root.currentVersion;
        if (!version) return null;

        return {
          rootId: root.id,
          versionId: version.id,
          title: version.title,
          updatedAt: version.updatedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return { count, items };
  }),

  /**
   * Posts scheduled for a future instant: the count and the soonest few, for the
   * "Contenuti in programmazione" widget.
   */
  getScheduled: permissionProcedure(PERMISSIONS.POSTS_READ).query(async () => {
    const where: Prisma.ScheduledActionWhereInput = {
      type: ScheduledActionType.PUBLISH_POST,
      status: ScheduledActionStatus.SCHEDULED,
      plannedAt: { gte: new Date() },
    };

    const [actions, count] = await Promise.all([
      db.scheduledAction.findMany({
        where,
        orderBy: { plannedAt: "asc" },
        take: LIST_LIMIT,
        select: { id: true, targetId: true, plannedAt: true },
      }),
      db.scheduledAction.count({ where }),
    ]);

    const roots = await db.postRoot.findMany({
      where: { id: { in: actions.map((action) => action.targetId) } },
      select: {
        id: true,
        currentVersion: { select: { title: true } },
      },
    });
    const titleByRootId = new Map(
      roots.map((root) => [root.id, root.currentVersion?.title ?? ""]),
    );

    return {
      count,
      items: actions.map((action) => ({
        actionId: action.id,
        rootId: action.targetId,
        title: titleByRootId.get(action.targetId) ?? "",
        plannedAt: action.plannedAt,
      })),
    };
  }),

  /**
   * Unpublished reviews: the count and the most recent few, for the
   * "Recensioni da moderare" widget.
   */
  getPendingReviews: permissionProcedure(PERMISSIONS.REVIEWS_READ).query(
    async () => {
      const where: Prisma.ReviewsWhereInput = { status: false };

      const [reviews, count] = await Promise.all([
        db.reviews.findMany({
          where,
          orderBy: { date: "desc" },
          take: LIST_LIMIT,
          select: {
            id: true,
            reviewerName: true,
            rating: true,
            date: true,
            product: {
              select: {
                id: true,
                currentVersion: { select: { title: true } },
              },
            },
          },
        }),
        db.reviews.count({ where }),
      ]);

      return {
        count,
        items: reviews.map((review) => ({
          id: review.id,
          reviewerName: review.reviewerName ?? "",
          rating: review.rating,
          date: review.date,
          productId: review.product.id,
          productTitle: review.product.currentVersion?.title ?? "",
        })),
      };
    },
  ),

  /**
   * Pending orders: the count and the most recent few, for the
   * "Ordini da completare" widget.
   */
  getPendingOrders: permissionProcedure(PERMISSIONS.ORDERS_READ).query(
    async () => {
      const where: Prisma.OrderWhereInput = { status: OrderStatus.PENDING };

      const [orders, count] = await Promise.all([
        db.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: LIST_LIMIT,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
            customer: { select: { name: true, email: true } },
          },
        }),
        db.order.count({ where }),
      ]);

      return {
        count,
        items: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          currency: order.currency,
          customerName: order.customer.name ?? order.customer.email,
          createdAt: order.createdAt,
        })),
      };
    },
  ),

  /**
   * Failed automation runs: the count and the most recent few, for the
   * "Automazioni in errore" widget.
   */
  getFailedRuns: permissionProcedure(PERMISSIONS.AUTOMATIONS_READ).query(
    async () => {
      const where: Prisma.AutomationRunWhereInput = {
        status: AutomationRunStatus.FAILED,
      };

      const [runs, count] = await Promise.all([
        db.automationRun.findMany({
          where,
          orderBy: { startedAt: "desc" },
          take: LIST_LIMIT,
          select: {
            id: true,
            automationId: true,
            startedAt: true,
            error: true,
            automation: { select: { name: true } },
          },
        }),
        db.automationRun.count({ where }),
      ]);

      return {
        count,
        items: runs.map((run) => ({
          id: run.id,
          automationId: run.automationId,
          automationName: run.automation.name,
          startedAt: run.startedAt,
          error: run.error,
        })),
      };
    },
  ),

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
