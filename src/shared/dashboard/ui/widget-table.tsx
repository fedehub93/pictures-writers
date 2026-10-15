"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { WidgetEmpty } from "./widget-states";

/**
 * One column of a WidgetTable: its header and how a row renders in it. The
 * owning widget declares its columns; the table only lays them out.
 */
export interface WidgetTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Extra classes applied to both the header and every body cell. */
  className?: string;
  /** Content alignment within the column. Defaults to `left`. */
  align?: "left" | "right";
  /**
   * Whether the column absorbs the table's spare width. Exactly one column
   * should grow; every other column shrinks to its content. Growing the last
   * column pins it to the table's trailing edge.
   */
  grow?: boolean;
}

interface WidgetTableProps<T> {
  columns: WidgetTableColumn<T>[];
  rows: T[];
  /** Stable React key for a row. */
  rowKey: (row: T) => string;
  /**
   * Destination the whole row navigates to; a cell may also link there itself.
   * Returning `undefined` leaves that row unclickable (e.g. a target the build
   * cannot route to).
   */
  rowHref: (row: T) => Route | undefined;
  /** Total record count, shown beside the number of rows on screen. */
  count: number;
  /** The full, filtered destination list. */
  href: Route;
  linkLabel: string;
  emptyMessage: string;
}

/**
 * The tabular body of a Dashboard list widget: a column header, one row per
 * record, and a footer linking to the full list. It lives in shared so content
 * widgets render the same body; the table fills the card's width and its
 * columns reflow, so a narrow card wraps the flexible column instead of
 * scrolling sideways.
 */
export const WidgetTable = <T,>({
  columns,
  rows,
  rowKey,
  rowHref,
  count,
  href,
  linkLabel,
  emptyMessage,
}: WidgetTableProps<T>) => {
  const router = useRouter();
  const isEmpty = rows.length === 0;

  const columnClass = (column: WidgetTableColumn<T>) =>
    cn(
      "px-3",
      column.grow ? "w-auto" : "w-px whitespace-nowrap",
      column.align === "right" && "text-right",
      column.className,
    );

  // Only the row area scrolls when a widget is shorter than its content: the
  // header stays pinned (`sticky`) and the footer stays put below, so the card
  // clips instead of spilling over the widget beneath it. The shared `Table`'s
  // own wrapper is neutralised to `overflow-visible` so this element is the one
  // scroll container the sticky header anchors to.
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {isEmpty ? (
        <WidgetEmpty message={emptyMessage} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto [&>div]:overflow-visible">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(columnClass(column), "h-10 text-xs")}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const href = rowHref(row);

                return (
                  <TableRow
                    key={rowKey(row)}
                    className={href ? "cursor-pointer" : undefined}
                    onClick={href ? () => router.push(href) : undefined}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(columnClass(column), "py-2.5")}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{isEmpty ? null : `${rows.length} of ${count}`}</span>
        <Button variant="link" size="sm" className="h-auto p-0" asChild>
          <Link href={href}>{linkLabel}</Link>
        </Button>
      </div>
    </div>
  );
};

interface WidgetTableSkeletonProps {
  columns: number;
  rows?: number;
}

/**
 * The loading body of a table widget: as many placeholder rows as the widget
 * lists, so the card does not jump when the data arrives.
 */
export const WidgetTableSkeleton = ({
  columns,
  rows = 5,
}: WidgetTableSkeletonProps) => (
  <div className="flex flex-col gap-4" role="status" aria-label="Loading">
    <div className="flex gap-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4">
        {Array.from({ length: columns }).map((_, columnIndex) => (
          <Skeleton key={columnIndex} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);
