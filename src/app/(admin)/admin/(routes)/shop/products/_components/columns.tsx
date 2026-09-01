"use client";

import {
  ContentStatus,
  Media,
  Product,
  ProductCategory,
  ProductType,
} from "@/generated/prisma";
import Image from "next/image";
import { createColumnHelper } from "@tanstack/react-table";
import { cn, getFirstCharUppercase } from "@/shared/lib/utils";

import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";

import { formatPrice } from "@/lib/format";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { ProductsAction } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type ProductRow = Product & {
  imageCover: Media | null;
  category: ProductCategory | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, ProductRow>();

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
  columnHelper.accessor("imageCover", {
    header: () => <span>Image</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const imageCover = row.original.imageCover;
      if (!imageCover) return null;
      return (
        <div className="relative h-20 aspect-1/2">
          <Image
            src={imageCover.url}
            alt={imageCover.altText || ""}
            fill
            className="rounded-md object-contain"
            unoptimized
          />
        </div>
      );
    },
  }),
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("category", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    enableSorting: false,
    cell: ({ row }) => {
      const category = row.original.category;
      if (!category) return <div>N/D</div>;
      return <div>{category.title}</div>;
    },
  }),
  columnHelper.accessor("type", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    sortFn: "text",
    filterFn: "arrIncludes",
    cell: ({ row }) => {
      const type = row.original.type;
      return <Badge>{type}</Badge>;
    },
  }),
  columnHelper.accessor("price", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    sortFn: "alphanumeric",
    cell: ({ row }) => {
      const price = row.original.price ?? 0.0;
      const type = row.original.type;

      if (type === ProductType.AFFILIATE) {
        return <span className="font-bold">N/D</span>;
      }
      return <span className="font-bold">{formatPrice(price, true)}</span>;
    },
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    sortFn: "text",
    filterFn: "arrIncludes",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className={cn(
            status === ContentStatus.DRAFT && "bg-slate-700",
            status === ContentStatus.CHANGED && "bg-sky-700",
            status === ContentStatus.PUBLISHED && "bg-emerald-700",
          )}
        >
          {getFirstCharUppercase(status.toLowerCase())}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { rootId, id } = row.original;
      return <ProductsAction rootId={rootId!} id={id} />;
    },
    enableHiding: false,
  }),
]);
