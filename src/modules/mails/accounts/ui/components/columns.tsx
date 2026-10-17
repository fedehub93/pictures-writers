"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { CircleCheckIcon } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { EmailAccountsAction } from "./actions";
import { EmailAccountActiveToggle } from "./active-toggle";
import { type EmailAccountGetManyRow } from "../../types";
import { type DataTableFeatures } from "./data-table-features";

const columnHelper = createColumnHelper<DataTableFeatures, EmailAccountGetManyRow>();

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
    filterFn: "includesString",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        {row.original.isDefault && (
          <span className="inline-flex items-center gap-x-1 text-xs font-medium text-emerald-700">
            <CircleCheckIcon className="size-3.5" />
            Default
          </span>
        )}
      </div>
    ),
  }),
  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("isActive", {
    header: "Active",
    enableSorting: false,
    cell: ({ row }) => (
      <EmailAccountActiveToggle account={row.original} />
    ),
  }),
  columnHelper.accessor("userPermissions", {
    header: "Users",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.original.userPermissions.length}
      </Badge>
    ),
  }),
  columnHelper.accessor("_count", {
    header: "Conversations",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original._count.conversations}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <EmailAccountsAction account={row.original} />,
    enableHiding: false,
  }),
]);
