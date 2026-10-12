"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/lib/format";

export const DraftsWidget = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.dashboard.getDrafts.queryOptions());

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="text-3xl font-bold">{data.count}</div>

      {data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nessuna bozza da pubblicare.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
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
        </ul>
      )}

      <Link
        href="/admin/posts?status=DRAFT"
        className="mt-auto pt-2 text-sm font-medium text-primary hover:underline"
      >
        Vedi tutte le bozze
      </Link>
    </div>
  );
};
