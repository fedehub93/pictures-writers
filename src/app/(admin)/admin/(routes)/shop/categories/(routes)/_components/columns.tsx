"use client";

import { ContentStatus, ProductCategory } from "@/generated/prisma";
import { createColumnHelper } from "@tanstack/react-table";
import { cn, getFirstCharUppercase } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { ProductCategoriesAction } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

const columnHelper = createColumnHelper<DataTableFeatures, ProductCategory>();

export const columns = columnHelper.columns([
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    sortFn: "text",
    filterFn: "includesString",
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
      const { rootId, id } = row.original;
      return <ProductCategoriesAction rootId={rootId!} id={id} />;
    },
    enableHiding: false,
  }),
]);
