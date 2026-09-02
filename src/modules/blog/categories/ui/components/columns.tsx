"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { ContentStatus } from "@/generated/prisma";

import { cn, getFirstCharUppercase } from "@/shared/lib/utils";

import { Badge } from "@/shared/ui/badge";
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
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    sortFn: "text",
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
      const { rootId, id, status } = row.original;

      if (!rootId) return null;

      return (
        <CategoriesActions
          rootId={rootId}
          id={id}
          status={status}
        />
      );
    },
    enableHiding: false,
  }),
]);
