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
 * The visual form of a column's placeholder while the widget loads: a plain
 * bar, a pill-shaped badge, a round avatar, or an avatar with a name beside it.
 */
export type WidgetCellShape = "text" | "badge" | "avatar" | "person";

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
  /**
   * The placeholder drawn in this column while the widget loads, so the loading
   * body mirrors the loaded table. Defaults to `text`, a plain bar.
   */
  skeleton?: WidgetCellShape;
}

/**
 * The subset of a column's fields that drive its layout, independent of the row
 * type. Lets the table and its loading skeleton lay out the same columns with
 * one helper, without threading the row generic through either.
 */
type WidgetColumnLayout = Pick<
  WidgetTableColumn<unknown>,
  "grow" | "align" | "className" | "skeleton"
>;

const columnClass = (column: WidgetColumnLayout, fixed = false) =>
  cn(
    "px-3",
    // In fixed layout the browser divides the width equally across columns and
    // every cell is clipped to one line, so a value too long to fit ellipsizes
    // instead of overlapping its neighbour. `grow` no longer affects layout
    // there; a column takes a wider share via `className` (e.g. `w-1/3`).
    fixed
      ? "truncate"
      : column.grow
        ? "w-auto"
        : "w-px whitespace-nowrap",
    column.align === "right" && "text-right",
    column.className,
  );

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
  /**
   * Whether the columns hold fixed, equal widths instead of sizing to their
   * content. A many-column widget spreads evenly rather than squeezing its
   * short columns against the trailing edge; a column can take a wider share
   * (`className: "w-1/3"`) or step out on a narrow card with a container-query
   * class (`className: "hidden @lg:table-cell"`), since the card is a
   * `@container` and every cell truncates rather than overlapping.
   */
  fixed?: boolean;
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
  fixed = false,
  emptyMessage,
}: WidgetTableProps<T>) => {
  const router = useRouter();
  const isEmpty = rows.length === 0;

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
          <Table className={fixed ? "table-fixed" : undefined}>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(columnClass(column, fixed), "h-10 text-xs")}
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
                        className={cn(columnClass(column, fixed), "py-2.5")}
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

const SkeletonCell = ({ column }: { column: WidgetColumnLayout }) => {
  switch (column.skeleton ?? "text") {
    case "avatar":
      return (
        <span className="inline-flex">
          <Skeleton className="size-6 rounded-full" />
        </span>
      );
    case "person":
      return (
        <span className="inline-flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </span>
      );
    case "badge":
      return <Skeleton className="inline-block h-5 w-14 rounded-full" />;
    default:
      return (
        <Skeleton
          className={cn("inline-block h-4", column.grow ? "w-2/3" : "w-16")}
        />
      );
  }
};

interface WidgetTableSkeletonProps<T> {
  /** The same columns the loaded table renders, so the two layouts match. */
  columns: WidgetTableColumn<T>[];
  /** How many placeholder rows to draw. Defaults to the shared widget cap. */
  rows?: number;
  /** Destination the footer link points at while the data loads. */
  href: Route;
  linkLabel: string;
  /** Whether the columns hold fixed, equal widths, matching the loaded table. */
  fixed?: boolean;
}

/**
 * The loading body of a table widget: the widget's own columns — real headers,
 * widths, and alignment, drawn as a real table — with every data cell replaced
 * by a placeholder shaped after the kind of cell it stands in for, and the
 * footer in place. The card therefore lays out as it will once the data
 * arrives and does not jump.
 */
export const WidgetTableSkeleton = <T,>({
  columns,
  rows = 5,
  href,
  linkLabel,
  fixed = false,
}: WidgetTableSkeletonProps<T>) => (
  <div className="flex h-full min-h-0 flex-col gap-3">
    <div
      className="min-h-0 flex-1 overflow-auto [&>div]:overflow-visible"
      role="status"
      aria-label="Loading"
    >
      <Table className={fixed ? "table-fixed" : undefined}>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(columnClass(column, fixed), "h-10 text-xs")}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(columnClass(column, fixed), "py-2.5")}
                >
                  <SkeletonCell column={column} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    <div className="mt-auto flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <Skeleton className="h-3 w-16" />
      <Button variant="link" size="sm" className="h-auto p-0" asChild>
        <Link href={href}>{linkLabel}</Link>
      </Button>
    </div>
  </div>
);
