"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { formatDate } from "@/shared/lib/format";

import { Checkbox } from "@/shared/ui/checkbox";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import type { ProductCategoriesGetMany } from "../../../types";

import { ProductCategoriesActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type ProductCategory = ProductCategoriesGetMany["items"][number];

const columnHelper = createColumnHelper<DataTableFeatures, ProductCategory>();

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
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("slug", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slug" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => (
      <div>{formatDate({ date: row.original.createdAt })}</div>
    ),
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;

      return <ProductCategoriesActions id={id} />;
    },
    enableHiding: false,
  }),
]);
