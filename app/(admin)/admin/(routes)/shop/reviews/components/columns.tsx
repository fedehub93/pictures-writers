"use client";

import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { ReviewsActions } from "./actions";

export const columns: ColumnDef<{
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
}>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
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
  },
  {
    accessorKey: "product",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const product =
        (row.getValue("product") as {
          id: string;
          title: string;
          imageCover: { url: string; altText: string | null } | null;
        } | null) || false;
      if (!product) return <div>N/D</div>;
      return (
        <div className="flex gap-x-6 min-w-64">
          <div className="rounded-md bg-accent relative aspect-square size-20">
            {product.imageCover && (
              <Image
                src={product.imageCover?.url!}
                alt={product.imageCover?.altText || "Product Image"}
                fill
                className="object-contain rounded-md p-2"
                unoptimized
              />
            )}
            {!product.imageCover && (
              <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-1 justify-center">
            <span className="text-sm line-clamp-1">{product.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi,
              quaerat perspiciatis debitis dicta porro architecto soluta.
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "reviewerName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reviewer
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "rating",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rating
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rating = row.original.rating;
      if (!rating) return <div>N/D</div>;
      return (
        <div className="flex text-primary items-center">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className="size-8"
              fill={i < rating ? "currentColor" : "none"}
            />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = formatDate({ date: row.original.date });
      return <div>{date}</div>;
    },
  },

  {
    accessorKey: "status",
    filterFn: (row, id, value) => {
      if (!value?.length) return true;
      return value.includes(row.getValue(id));
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") || false;
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
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id, status } = row.original;
      return <ReviewsActions id={id} status={status} />;
    },
  },
];
