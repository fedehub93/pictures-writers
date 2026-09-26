"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";

import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import type { CredentialsGetMany } from "../../types";
import type { DataTableFeatures } from "./data-table-features";
import { CredentialActions } from "./actions";

const columnHelper = createColumnHelper<
  DataTableFeatures,
  CredentialsGetMany["items"][number]
>();

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected();
      const isSomeSelected = table.getIsSomePageRowsSelected();

      return (
        <Checkbox
          checked={
            isAllSelected || (isSomeSelected && !isAllSelected && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
  columnHelper.accessor("type", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    sortFn: "text",
    cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
  }),
  columnHelper.accessor("updatedAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => <div>{format(new Date(row.original.updatedAt), "PP p")}</div>,
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <CredentialActions credential={row.original} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }),
]);
