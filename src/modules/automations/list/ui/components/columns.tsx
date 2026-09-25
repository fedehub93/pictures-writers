"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";

import { AutomationStatus } from "@/generated/prisma";

import { cn, getFirstCharUppercase } from "@/shared/lib/utils";

import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import type { AutomationsGetMany } from "../../../types";

import { AutomationActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type Automation = AutomationsGetMany["items"][number];

const columnHelper = createColumnHelper<DataTableFeatures, Automation>();

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
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
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
            status === AutomationStatus.DRAFT && "bg-slate-700",
            status === AutomationStatus.PUBLISHED && "bg-emerald-700",
          )}
        >
          {getFirstCharUppercase(status.toLowerCase())}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("updatedAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => {
      const date = new Date(row.original.updatedAt);
      return <div>{format(date, "PP p")}</div>;
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id, name } = row.original;

      return <AutomationActions id={id} name={name} />;
    },
    enableHiding: false,
  }),
]);