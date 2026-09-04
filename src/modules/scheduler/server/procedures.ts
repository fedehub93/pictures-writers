import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";

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

export const schedulerRouter = createTRPCRouter({
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
