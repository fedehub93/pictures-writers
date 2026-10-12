"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/lib/format";

import { WidgetList } from "../components/widget-list";

export const DraftsWidget = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.dashboard.getDrafts.queryOptions());

  return (
    <WidgetList
      count={data.count}
      isEmpty={data.items.length === 0}
      emptyMessage="Nessuna bozza da pubblicare."
      href="/admin/posts?status=DRAFT"
      linkLabel="Vedi tutte le bozze"
    >
      {data.items.map((item) => (
        <li
          key={item.versionId}
          className="flex items-center justify-between gap-3"
        >
          <Link
            href={`/admin/posts/${item.rootId}`}
            className="truncate text-sm hover:underline"
          >
            {item.title}
          </Link>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDate({ date: item.updatedAt })}
          </span>
        </li>
      ))}
    </WidgetList>
  );
};
