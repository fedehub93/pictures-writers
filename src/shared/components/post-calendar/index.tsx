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
} from "date-fns";
import { enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, NotebookPenIcon, Plus } from "lucide-react";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./post-calendar.css";

import { ContentStatus } from "@/generated/prisma";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { PostsGetMany } from "@/modules/blog/posts/types";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface PostCalendarProps {
  posts: (PostsGetMany["items"][number] & {
    date: Date;
  })[];
  isPending: boolean;
  currentDate: Date;
  view: "month" | "week";
  onViewChange: (view: string) => void;
  onDateChange: (date: Date) => void;
  onPostClick: (post: PostsGetMany["items"][number]) => void;
  onCreatePost: (date: Date) => void;
  rightActions?: React.ReactNode;
}

export function PostCalendar({
  posts,
  isPending,
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onPostClick,
  onCreatePost,
  rightActions,
}: PostCalendarProps) {
  const events = React.useMemo(
    () =>
      isPending
        ? []
        : posts.map((p) => ({
            ...p,
            title: p.title,
            start: new Date(p.date!),
            end: addHours(new Date(p.date!), 1),
          })),
    [posts, isPending],
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

  const CustomToolbar = (
    toolbar: ToolbarProps<PostsGetMany["items"][number]>,
  ) => {
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
        events={events}
        date={currentDate}
        formats={formats}
        step={15}
        timeslots={4}
        min={startOfDay(new Date())}
        max={addHours(startOfDay(new Date()), 22)}
        onNavigate={onDateChange}
        view={view === "month" ? Views.MONTH : Views.WEEK}
        onView={(v) => onViewChange(v === Views.MONTH ? "month" : "week")}
        onSelectEvent={(event: PostsGetMany["items"][number]) =>
          onPostClick(event)
        }
        //onSelectSlot={({ start }) => onCreatePost(start)}

        // In week view, disable past time slots
        // and style them differently
        slotPropGetter={(date) => {
          const isPastSlot = isBefore(date, new Date());
          return isPastSlot
            ? {
                className: "rbc-time-slot-disabled",
                style: {
                  backgroundColor: "hsl(var(--muted) / 0.35)",
                  pointerEvents: "none",
                },
              }
            : {};
        }}
        // In month view, disable past dates and style them differently
        dayPropGetter={(date: Date) => {
          const isPastDate = isBefore(startOfDay(date), startOfDay(new Date()));
          return isPastDate
            ? {
                className: "pointer-events-none",
                style: { backgroundColor: "hsl(var(--muted) / 0.5)" },
              }
            : {};
        }}
        components={{
          toolbar: CustomToolbar,
          event: ({ event }) => {
            return (
              <>
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 p-1 h-full",
                    event.status === ContentStatus.PUBLISHED &&
                      "text-muted-foreground",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPostClick(event);
                  }}
                >
                  <div className="flex gap-2">
                    <NotebookPenIcon size={16} />
                    <span className="text-xs truncate max-w-20 xl:max-w-35">
                      {event?.title}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {format(event.scheduledAt!, "HH:mm")}
                  </span>
                </div>
              </>
            );
          },

          month: {
            dateHeader: ({ label, date: cellDate }: any) => {
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
                          console.log(cellDate);
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
