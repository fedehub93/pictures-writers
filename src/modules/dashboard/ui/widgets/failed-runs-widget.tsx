"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/lib/format";

import { WidgetList } from "../components/widget-list";

export const FailedRunsWidget = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.dashboard.getFailedRuns.queryOptions());

  return (
    <WidgetList
      count={data.count}
      isEmpty={data.items.length === 0}
      emptyMessage="Nessuna automazione in errore."
      href="/admin/automations/executions?status=FAILED"
      linkLabel="Vedi le esecuzioni"
    >
      {data.items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3">
          <Link
            href={`/admin/automations/${item.automationId}/executions/${item.id}`}
            className="truncate text-sm hover:underline"
          >
            {item.automationName}
          </Link>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDate({ date: item.startedAt })}
          </span>
        </li>
      ))}
    </WidgetList>
  );
};
