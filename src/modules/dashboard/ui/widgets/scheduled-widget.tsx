"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/lib/format";

import { WidgetList } from "../components/widget-list";

export const ScheduledWidget = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.dashboard.getScheduled.queryOptions());

  return (
    <WidgetList
      count={data.count}
      isEmpty={data.items.length === 0}
      emptyMessage="No scheduled content."
      href="/admin/schedule?status=SCHEDULED"
      linkLabel="View scheduling"
    >
      {data.items.map((item) => (
        <li
          key={item.actionId}
          className="flex items-center justify-between gap-3"
        >
          <Link
            href={`/admin/posts/${item.rootId}`}
            className="truncate text-sm hover:underline"
          >
            {item.title || "Untitled post"}
          </Link>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDate({ date: item.plannedAt })}
          </span>
        </li>
      ))}
    </WidgetList>
  );
};
