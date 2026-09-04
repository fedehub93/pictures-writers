"use client";
import * as React from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type Culture,
  type DateLocalizer,
  type ToolbarProps,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addHours,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  MailIcon,
  NotebookPenIcon,
  Plus,
} from "lucide-react";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./post-calendar.css";

import { ScheduledActionStatus, ScheduledActionType } from "@/generated/prisma";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import type { CalendarEvent, CalendarEventStatus } from "@/modules/scheduler/types";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface PostCalendarProps {
  events: CalendarEvent[];
  isPending: boolean;
  currentDate: Date;
  view: "month" | "week";
  onViewChange: (view: string) => void;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreatePost: (date: Date) => void;
  rightActions?: React.ReactNode;
}

const statusVariantMap: Record<CalendarEventStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [ScheduledActionStatus.SCHEDULED]: "secondary",
  [ScheduledActionStatus.PROCESSING]: "default",
  [ScheduledActionStatus.RETRY_WAIT]: "default",
  [ScheduledActionStatus.SUCCEEDED]: "outline",
  [ScheduledActionStatus.FAILED]: "destructive",
  [ScheduledActionStatus.CANCELED]: "outline",
  PUBLISHED: "outline",
};

const statusLabelMap: Record<CalendarEventStatus, string> = {
  [ScheduledActionStatus.SCHEDULED]: "Scheduled",
  [ScheduledActionStatus.PROCESSING]: "Processing",
  [ScheduledActionStatus.RETRY_WAIT]: "Retry",
  [ScheduledActionStatus.SUCCEEDED]: "Done",
  [ScheduledActionStatus.FAILED]: "Failed",
  [ScheduledActionStatus.CANCELED]: "Canceled",
  PUBLISHED: "Published",
};

export function PostCalendar({
  events,
  isPending,
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onEventClick,
  onCreatePost,
  rightActions,
}: PostCalendarProps) {
  const calendarEvents = React.useMemo(
    () =>
      isPending
        ? []
        : events.map((event) => ({
            ...event,
            title: event.title,
            start: event.start,
            end: event.end,
          })),
    [events, isPending],
  );

  const formats = React.useMemo(
    () => ({
      weekdayFormat: (
        date: Date,
        culture?: Culture,
        localizer?: DateLocalizer,
      ): string => localizer?.format(date, "EEEE", culture) ?? "",

      dayFormat: (
        date: Date,
        culture?: Culture,
        localizer?: DateLocalizer,
      ): string => localizer?.format(date, "EEEE d", culture) ?? "",
    }),
    [],
  );

  const CustomToolbar = (toolbar: ToolbarProps<CalendarEvent>) => {
    return (
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none border-r"
                onClick={() => toolbar.onNavigate("PREV")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={() => toolbar.onNavigate("NEXT")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <span className="text-base font-semibold">
              {format(toolbar.date, "MMMM yyyy", { locale: enUS })}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="font-medium"
              onClick={() => toolbar.onNavigate("TODAY")}
            >
              Today
            </Button>

            <select
              className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
              value={view}
              onChange={(e) => onViewChange(e.target.value)}
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
          </div>

          <div className="flex items-center gap-2">{rightActions}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("h-full relative flex flex-col min-h-150")}>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        date={currentDate}
        formats={formats}
        step={15}
        timeslots={4}
        min={startOfDay(new Date())}
        max={endOfDay(new Date())}
        onNavigate={onDateChange}
        view={view === "month" ? Views.MONTH : Views.WEEK}
        onView={(v) => onViewChange(v === Views.MONTH ? "month" : "week")}
        onSelectEvent={(event: CalendarEvent) => onEventClick(event)}
        components={{
          toolbar: CustomToolbar,
          event: ({ event }) => {
            const isEmail = event.type === ScheduledActionType.SEND_EMAIL;
            const displayTime = event.start;

            return (
              <div
                className={cn(
                  "flex flex-col gap-0.5 p-1 h-full cursor-pointer",
                  event.status === ScheduledActionStatus.SUCCEEDED &&
                    "text-muted-foreground",
                  event.status === "PUBLISHED" && "text-muted-foreground",
                  event.overdue &&
                    "border-l-2 border-l-destructive bg-destructive/5",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
                title={
                  event.plannedAt && event.executedAt
                    ? `Planned: ${format(event.plannedAt, "PPpp")}\nExecuted: ${format(event.executedAt, "PPpp")}`
                    : event.plannedAt
                      ? `Planned: ${format(event.plannedAt, "PPpp")}`
                      : undefined
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2 min-w-0">
                    {isEmail ? (
                      <MailIcon size={14} />
                    ) : (
                      <NotebookPenIcon size={14} />
                    )}
                    <span className="text-xs truncate max-w-20 xl:max-w-35">
                      {event.title}
                    </span>
                  </div>
                  <span className="font-semibold text-xs shrink-0">
                    {format(displayTime, "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={statusVariantMap[event.status]}
                    className="text-[9px] px-1 py-0 h-auto"
                  >
                    {statusLabelMap[event.status]}
                  </Badge>
                  {event.overdue && (
                    <Badge
                      variant="destructive"
                      className="text-[9px] px-1 py-0 h-auto"
                    >
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            );
          },

          month: {
            dateHeader: ({
              label,
              date: cellDate,
            }: {
              label: string;
              date: Date;
            }) => {
              const isCellToday =
                format(cellDate, "yyyy-MM-dd") ===
                format(new Date(), "yyyy-MM-dd");
              const isPastDate = isBefore(cellDate, startOfDay(new Date()));
              return (
                <>
                  <div className="group flex items-center justify-between w-full">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-sm font-medium",
                        isCellToday
                          ? "bg-accent-foreground text-white"
                          : isPastDate
                            ? "text-muted-foreground"
                            : "text-foreground",
                      )}
                    >
                      {label}
                    </span>
                    {!isPastDate && !isPending && (
                      <Button
                        size="sm"
                        variant="default"
                        className="p-px! size-6! mt-1 mb-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreatePost(cellDate);
                        }}
                      >
                        <Plus className="size-3" />
                      </Button>
                    )}
                  </div>
                  {isPending && <Skeleton className="h-8 w-11/12 m-2 my-5" />}
                </>
              );
            },
          },
        }}
      />
    </div>
  );
}
