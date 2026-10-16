"use client";

import { StarIcon } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Route } from "next";

import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import type { WidgetComponentProps } from "@/shared/dashboard/types";
import { WidgetPerson } from "@/shared/dashboard/ui/widget-person";
import {
  WidgetTable,
  WidgetTableSkeleton,
  type WidgetTableColumn,
} from "@/shared/dashboard/ui/widget-table";

import { DASHBOARD_LIST_LIMIT } from "../constants";

interface ReviewRow {
  id: string;
  reviewerName: string;
  rating: number;
  date: Date;
  status: boolean;
  productTitle: string;
}

const resolveStatuses = (value: unknown): boolean[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const statuses = value
    .map((item) => (item === "true" ? true : item === "false" ? false : null))
    .filter((item): item is boolean => item !== null);

  return statuses.length > 0 ? statuses : undefined;
};

const columns: WidgetTableColumn<ReviewRow>[] = [
  {
    id: "reviewer",
    header: "Reviewer",
    grow: true,
    skeleton: "person",
    cell: (row) => <WidgetPerson name={row.reviewerName || "Anonymous"} />,
  },
  {
    id: "product",
    header: "Product",
    grow: true,
    // Only Reviewer and Rating are always shown. The product returns first as
    // the card widens, then status and date — so a narrow card stays legible.
    className: "hidden @lg:table-cell",
    cell: (row) => <span className="text-muted-foreground">{row.productTitle}</span>,
  },
  {
    id: "rating",
    header: "Rating",
    align: "right",
    skeleton: "badge",
    cell: (row) => (
      <Badge variant="secondary" className="gap-1 [&_svg]:size-3">
        <StarIcon className="fill-current" />
        {row.rating.toLocaleString("it-IT")}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    align: "right",
    skeleton: "badge",
    className: "hidden @xl:table-cell",
    cell: (row) => (
      <Badge
        className={cn(
          row.status
            ? "bg-primary"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {row.status ? "Published" : "Unpublished"}
      </Badge>
    ),
  },
  {
    id: "date",
    header: "Date",
    align: "right",
    className: "hidden @xl:table-cell",
    cell: (row) => (
      <span className="text-muted-foreground">
        {formatDate({ date: row.date })}
      </span>
    ),
  },
];

export const ReviewsWidget = ({ instance }: WidgetComponentProps) => {
  const trpc = useTRPC();
  const status = resolveStatuses(instance.config?.status);
  const { data } = useSuspenseQuery(
    trpc.reviews.getSummary.queryOptions({ status }),
  );

  // The admin reviews list reads one `status` at a time, so the footer only
  // carries a filter when a single state is selected.
  const href =
    status && status.length === 1
      ? (`/admin/shop/reviews?status=${status[0]}` as Route)
      : "/admin/shop/reviews";

  return (
    <WidgetTable
      columns={columns}
      rows={data.items}
      rowKey={(row) => row.id}
      rowHref={() => undefined}
      count={data.count}
      href={href}
      linkLabel="View reviews"
      fixed
      emptyMessage="No reviews."
    />
  );
};

export const ReviewsWidgetSkeleton = () => (
  <WidgetTableSkeleton
    columns={columns}
    rows={DASHBOARD_LIST_LIMIT}
    href="/admin/shop/reviews"
    linkLabel="View reviews"
    fixed
  />
);
