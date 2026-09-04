import type {
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";

export type CalendarEventType = ScheduledActionType;

export type CalendarEventStatus = ScheduledActionStatus | "PUBLISHED";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  start: Date;
  end: Date;
  timezone: string;
  status: CalendarEventStatus;
  targetType: string;
  targetId: string;
  plannedAt: Date | null;
  executedAt: Date | null;
  overdue: boolean;
  url: string;
}

export interface GetCalendarEventsInput {
  from: Date;
  to: Date;
  actionTypes?: CalendarEventType[];
  statuses?: CalendarEventStatus[];
}
