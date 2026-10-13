import { z } from "zod";

import { createTRPCRouter, permissionProcedure, protectedProcedure } from "@/trpc/init";
import { ScheduledActionStatus, ScheduledActionType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { getCalendarEvents } from "../lib/calendar-query";
import { describeScheduledActions } from "../lib/describe-scheduled-action";
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
const DASHBOARD_LIST_LIMIT = 6;

export const schedulerRouter = createTRPCRouter({
  /**
   * Everything scheduled for a future instant — posts to publish, newsletters to
   * send, and whatever a later action type targets: the count and the soonest
   * few, for the dashboard's "Scheduled Content" widget. `types` narrows it to
   * the chosen action types; omitting it (or an empty list) lists every type.
   */
  getScheduled: permissionProcedure(PERMISSIONS.POSTS_READ)
    .input(
      z.object({ types: z.array(calendarEventTypeSchema).optional() }).optional(),
    )
    .query(async ({ input }) => {
      const types =
        input?.types && input.types.length > 0 ? input.types : undefined;

      const where = {
        status: ScheduledActionStatus.SCHEDULED,
        plannedAt: { gte: new Date() },
        ...(types ? { type: { in: types } } : {}),
      };

      const [actions, count] = await Promise.all([
        db.scheduledAction.findMany({
          where,
          orderBy: { plannedAt: "asc" },
          take: DASHBOARD_LIST_LIMIT,
          select: {
            id: true,
            type: true,
            targetType: true,
            targetId: true,
            plannedAt: true,
            timezone: true,
          },
        }),
        db.scheduledAction.count({ where }),
      ]);

      const descriptions = await describeScheduledActions(actions);

      return {
        count,
        items: actions.map((action) => {
          const description = descriptions.get(action.id);

          return {
            actionId: action.id,
            type: action.type,
            targetId: action.targetId,
            title: description?.title ?? "",
            url: description?.url ?? "",
            plannedAt: action.plannedAt,
            timezone: action.timezone,
          };
        }),
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
