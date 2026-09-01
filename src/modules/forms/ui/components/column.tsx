"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { FormsGetMany } from "../../types";

import { FormsActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type Form = FormsGetMany[number];

const columnHelper = createColumnHelper<DataTableFeatures, Form>();

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("gtmLabel", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GTM Label" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("gtmEventName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GTM Event Name" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("gtmCategory", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GTM Category" />
    ),
    sortFn: "text",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return <FormsActions id={id} data={row.original} />;
    },
    enableHiding: false,
  }),
]);
