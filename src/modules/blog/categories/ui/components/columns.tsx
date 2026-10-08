"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { Checkbox } from "@/shared/ui/checkbox";

import { formatDate } from "@/shared/lib/format";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import type { CategoriesGetMany } from "../../types";

import { CategoriesActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type Category = CategoriesGetMany["items"][number];

const columnHelper = createColumnHelper<DataTableFeatures, Category>();

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
    cell: ({ row }) => {
      const date = formatDate({ date: row.original.createdAt });
      return <div>{date}</div>;
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <CategoriesActions id={row.original.id} />,
    enableHiding: false,
  }),
]);
