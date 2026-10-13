"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MailIcon, NotebookPenIcon, type LucideIcon } from "lucide-react";

import { ScheduledActionType } from "@/generated/prisma";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/lib/format";
import { Badge } from "@/shared/ui/badge";
import type { WidgetComponentProps } from "@/shared/dashboard/types";
import {
  WidgetTable,
  WidgetTableSkeleton,
  type WidgetTableColumn,
} from "@/shared/dashboard/ui/widget-table";

interface ScheduledRow {
  actionId: string;
  type: ScheduledActionType;
  targetId: string;
  title: string;
  url: string;
  plannedAt: Date;
  timezone: string;
}

const TYPE_PRESENTATION: Record<
  ScheduledActionType,
  { label: string; Icon: LucideIcon }
> = {
  [ScheduledActionType.PUBLISH_POST]: { label: "Post", Icon: NotebookPenIcon },
  [ScheduledActionType.SEND_EMAIL]: { label: "Newsletter", Icon: MailIcon },
};

const TypeBadge = ({ type }: { type: ScheduledActionType }) => {
  const { label, Icon } = TYPE_PRESENTATION[type];

  return (
    <Badge variant="secondary" className="gap-1 font-normal">
      <Icon className="size-3" />
      {label}
    </Badge>
  );
};

/**
 * Split the planned instant into its date and time parts, formatted in the
 * timezone captured when it was scheduled, so the widget shows the wall-clock
 * time the editor chose, not the viewer's.
 */
const formatScheduledAt = (date: Date, timezone: string) => {
  const value = new Date(date);

  try {
    const datePart = new Intl.DateTimeFormat("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: timezone,
    }).format(value);

    const timePart = new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(value);

    return { date: datePart, time: timePart };
  } catch {
    return { date: formatDate({ date }), time: "" };
  }
};

const columns: WidgetTableColumn<ScheduledRow>[] = [
  {
    id: "type",
    header: "Type",
    cell: (row) => <TypeBadge type={row.type} />,
  },
  {
    id: "title",
    header: "Title",
    grow: true,
    cell: (row) =>
      row.url ? (
        <Link href={row.url as Route} className="font-medium hover:underline">
          {row.title}
        </Link>
      ) : (
        <span className="font-medium">{row.title}</span>
      ),
  },
  {
    id: "plannedAt",
    header: "Scheduled for",
    align: "right",
    cell: (row) => {
      const { date, time } = formatScheduledAt(row.plannedAt, row.timezone);

      return (
        <span className="flex items-center justify-end gap-2 text-muted-foreground">
          <span>{date}</span>
          {time ? (
            <>
              <span className="h-3.5 w-px bg-border" aria-hidden />
              <span className="tabular-nums">{time}</span>
            </>
          ) : null}
        </span>
      );
    },
  },
];

const SCHEDULER_TYPES: ScheduledActionType[] = [
  ScheduledActionType.PUBLISH_POST,
  ScheduledActionType.SEND_EMAIL,
];

const resolveTypes = (value: unknown): ScheduledActionType[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const types = value.filter((item): item is ScheduledActionType =>
    SCHEDULER_TYPES.includes(item as ScheduledActionType),
  );

  return types.length > 0 ? types : undefined;
};

export const ScheduledWidget = ({ instance }: WidgetComponentProps) => {
  const trpc = useTRPC();
  const types = resolveTypes(instance.config?.types);
  const { data } = useSuspenseQuery(
    trpc.scheduler.getScheduled.queryOptions({ types }),
  );

  return (
    <WidgetTable
      columns={columns}
      rows={data.items}
      rowKey={(row) => row.actionId}
      rowHref={(row) => (row.url ? (row.url as Route) : undefined)}
      count={data.count}
      href="/admin/schedule?status=SCHEDULED"
      linkLabel="View scheduling"
      emptyMessage="No scheduled content."
    />
  );
};

export const ScheduledWidgetSkeleton = () => <WidgetTableSkeleton columns={3} />;
