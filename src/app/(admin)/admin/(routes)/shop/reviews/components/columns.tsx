"use client";

import Image from "next/image";
import { createColumnHelper } from "@tanstack/react-table";
import { StarIcon } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";

import { cn } from "@/shared/lib/utils";
import { formatDate } from "@/lib/format";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { ReviewsActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type Review = {
  id: string;
  product: {
    id: string;
    title: string;
    imageCover: { url: string; altText: string | null } | null;
  };
  rating: number;
  reviewerName: string | null;
  date: Date;
  status: boolean;
};

const columnHelper = createColumnHelper<DataTableFeatures, Review>();

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected();
      const isSomeSelected = table.getIsSomePageRowsSelected();

      return (
        <Checkbox
          checked={
            isAllSelected ||
            (isSomeSelected && !isAllSelected && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
          className="translate-y-0.5"
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("product", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    enableSorting: false,
    cell: ({ row }) => {
      const product = row.original.product;
      if (!product) return <div>N/D</div>;
      return (
        <div className="flex min-w-64 gap-x-6">
          <div className="relative aspect-square size-20 rounded-md bg-accent">
            {product.imageCover && !!product.imageCover.url && (
              <Image
                src={product.imageCover.url}
                alt={product.imageCover.altText || "Product Image"}
                fill
                className="rounded-md object-contain p-2"
                unoptimized
              />
            )}
            {!product.imageCover && (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center space-y-1">
            <span className="text-sm line-clamp-1">{product.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi,
              quaerat perspiciatis debitis dicta porro architecto soluta.
            </span>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("reviewerName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reviewer" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("rating", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rating" />
    ),
    sortFn: "alphanumeric",
    cell: ({ row }) => {
      const rating = row.original.rating;
      if (!rating) return <div>N/D</div>;
      return (
        <div className="flex items-center text-primary">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className="size-6"
              fill={i < rating ? "currentColor" : "none"}
            />
          ))}
        </div>
      );
    },
  }),
  columnHelper.accessor("date", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => {
      const date = formatDate({ date: row.original.date });
      return <div>{date}</div>;
    },
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    sortFn: "alphanumeric",
    filterFn: "arrIncludes",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className={cn(
            !status && "bg-secondary text-secondary-foreground",
            status && "bg-primary",
          )}
        >
          {!status ? "Unpublished" : "Published"}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id, status } = row.original;
      return <ReviewsActions id={id} status={status} />;
    },
    enableHiding: false,
  }),
]);
