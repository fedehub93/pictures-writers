"use client";

import { useMemo, useState } from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMilliseconds,
} from "date-fns";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

import { CreatePostDialog } from "@/modules/blog/posts/ui/admin/components/create-post-dialog";
import { useOpenPost } from "@/modules/blog/posts/hooks/use-open-post";
import {
  useCalendarFilters,
  CALENDAR_FILTER_ALL,
} from "@/modules/scheduler/hooks/use-calendar-filters";
import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarEventType,
} from "@/modules/scheduler/types";

import { PostCalendar } from "./post-calendar";
import { ScheduleToolbar } from "./schedule-toolbar";

type ViewType = "month" | "week";

export const Calendar = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const [view, setView] = useQueryState("view", { defaultValue: "month" });
  const { onOpen } = useOpenPost();
  const [filters, setFilters] = useCalendarFilters();

  const [currentDate, setCurrentDate] = useState(new Date());

  const { from, to } = useMemo(() => {
    if (view === "week") {
      return {
        from: startOfWeek(currentDate, { weekStartsOn: 1 }),
        to: addMilliseconds(endOfWeek(currentDate, { weekStartsOn: 1 }), 1),
      };
    }

    return {
      from: startOfMonth(currentDate),
      to: addMilliseconds(endOfMonth(currentDate), 1),
    };
  }, [currentDate, view]);

  const actionTypes = useMemo<CalendarEventType[] | undefined>(
    () =>
      filters.actionType && filters.actionType !== CALENDAR_FILTER_ALL
        ? [filters.actionType as CalendarEventType]
        : undefined,
    [filters.actionType],
  );

  const statuses = useMemo<CalendarEventStatus[] | undefined>(
    () =>
      filters.status && filters.status !== CALENDAR_FILTER_ALL
        ? [filters.status as CalendarEventStatus]
        : undefined,
    [filters.status],
  );

  const { data: events, isLoading } = useQuery({
    ...trpc.scheduler.getCalendarEvents.queryOptions({
      from,
      to,
      actionTypes,
      statuses,
    }),
    enabled: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const handleEventClick = (event: CalendarEvent) => {
    if (event.url) {
      router.push(event.url as Parameters<typeof router.push>[0]);
    }
  };

  const handleCreatePost = (date: Date) => {
    onOpen({ scheduledAt: date });
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden h-full">
        <div className="p-6 pt-4 h-full min-h-0 w-full">
          <PostCalendar
            events={events ?? []}
            isPending={isLoading}
            currentDate={currentDate}
            view={view as ViewType}
            onViewChange={setView}
            onDateChange={setCurrentDate}
            onEventClick={handleEventClick}
            onCreatePost={handleCreatePost}
            rightActions={
              <ScheduleToolbar
                selectedActionType={filters.actionType}
                setSelectedActionType={(actionType) =>
                  setFilters({ actionType: actionType ?? CALENDAR_FILTER_ALL })
                }
                selectedStatus={filters.status}
                setSelectedStatus={(status) =>
                  setFilters({ status: status ?? CALENDAR_FILTER_ALL })
                }
              />
            }
          />
        </div>
      </div>
      <CreatePostDialog />
    </>
  );
};
