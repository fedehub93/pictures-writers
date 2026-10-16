import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { WidgetEmpty } from "./widget-states";

interface WidgetListProps {
  count: number;
  isEmpty: boolean;
  emptyMessage: string;
  href: Route;
  linkLabel: string;
  children: ReactNode;
}

/**
 * The shared body of an operational Dashboard widget: a headline count, a short
 * list of records, and a link to the destination list filtered by status. It
 * lives in shared so a domain module's widget renders the same body as every
 * other.
 */
export const WidgetList = ({
  count,
  isEmpty,
  emptyMessage,
  href,
  linkLabel,
  children,
}: WidgetListProps) => {
  // The list scrolls when it outgrows the card; the headline count and the
  // footer link stay put, so the card clips rather than spilling over its
  // neighbour.
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="text-2xl font-bold">{count}</div>

      {isEmpty ? (
        <WidgetEmpty message={emptyMessage} />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {children}
        </ul>
      )}

      <Button variant="link" size="sm" className="mt-auto self-start" asChild>
        <Link href={href}>{linkLabel}</Link>
      </Button>
    </div>
  );
};

interface WidgetListSkeletonProps {
  /** How many placeholder rows to draw. Defaults to the shared list cap. */
  rows?: number;
  /** Destination the footer link points at while the data loads. */
  href: Route;
  linkLabel: string;
}

/**
 * The loading body of a list widget: the headline count as a placeholder, one
 * row per record — a truncated name and its date — and the footer link, so the
 * card lays out as it will once the data arrives.
 */
export const WidgetListSkeleton = ({
  rows = 5,
  href,
  linkLabel,
}: WidgetListSkeletonProps) => (
  <div
    className="flex h-full min-h-0 flex-col gap-3"
    role="status"
    aria-label="Loading"
  >
    <Skeleton className="h-7 w-10" />

    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <li
          key={rowIndex}
          className="flex items-center justify-between gap-3"
        >
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-20 shrink-0" />
        </li>
      ))}
    </ul>

    <Button variant="link" size="sm" className="mt-auto self-start" asChild>
      <Link href={href}>{linkLabel}</Link>
    </Button>
  </div>
);
