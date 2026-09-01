"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { Checkbox } from "@/shared/ui/checkbox";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import type { FormSubmissionsGetMany } from "../../types";

import { SubmissionsActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type Submission = FormSubmissionsGetMany[number];

const columnHelper = createColumnHelper<DataTableFeatures, Submission>();

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
  columnHelper.accessor("form", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    enableSorting: false,
    cell: ({ row }) => {
      const { form } = row.original;
      return <div className="flex items-center gap-x-4">{form.name}</div>;
    },
  }),
  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    sortFn: "text",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return <SubmissionsActions id={id} />;
    },
    enableHiding: false,
  }),
]);
