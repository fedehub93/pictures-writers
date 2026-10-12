import { z } from "zod";

import { createTRPCRouter, permissionProcedure, protectedProcedure } from "@/trpc/init";
import { ScheduledActionStatus, ScheduledActionType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { getCalendarEvents } from "../lib/calendar-query";
import type { CalendarEventStatus, CalendarEventType } from "../types";

const calendarEventStatuses: [CalendarEventStatus, ...CalendarEventStatus[]] = [
  ScheduledActionStatus.SCHEDULED,
  ScheduledActionStatus.PROCESSING,
  ScheduledActionStatus.RETRY_WAIT,
  ScheduledActionStatus.SUCCEEDED,
  ScheduledActionStatus.FAILED,
  ScheduledActionStatus.CANCELED,
  "PUBLISHED",
];

const calendarEventTypes: [CalendarEventType, ...CalendarEventType[]] = [
  ScheduledActionType.PUBLISH_POST,
  ScheduledActionType.SEND_EMAIL,
];

const calendarEventStatusSchema = z.enum(calendarEventStatuses);
const calendarEventTypeSchema = z.enum(calendarEventTypes);

/** How many records the dashboard's scheduled-content widget lists at once. */
const DASHBOARD_LIST_LIMIT = 5;

export const schedulerRouter = createTRPCRouter({
  /**
   * Posts scheduled for a future instant: the count and the soonest few, for the
   * dashboard's "Scheduled content" widget.
   */
  getScheduled: permissionProcedure(PERMISSIONS.POSTS_READ).query(async () => {
    const where = {
      type: ScheduledActionType.PUBLISH_POST,
      status: ScheduledActionStatus.SCHEDULED,
      plannedAt: { gte: new Date() },
    };

    const [actions, count] = await Promise.all([
      db.scheduledAction.findMany({
        where,
        orderBy: { plannedAt: "asc" },
        take: DASHBOARD_LIST_LIMIT,
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

  getCalendarEvents: protectedProcedure
    .input(
      z.object({
        from: z.coerce.date(),
        to: z.coerce.date(),
        actionTypes: z.array(calendarEventTypeSchema).optional(),
        statuses: z.array(calendarEventStatusSchema).optional(),
      }),
    )
    .query(async ({ input }) => {
      return getCalendarEvents({
        from: input.from,
        to: input.to,
        actionTypes: input.actionTypes,
        statuses: input.statuses,
      });
    }),
});
