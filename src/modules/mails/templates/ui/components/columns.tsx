"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { TemplatesGetMany } from "../../types";
import { TemplateAction } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type Template = TemplatesGetMany[number];

const columnHelper = createColumnHelper<DataTableFeatures, Template>();

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("description", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    sortFn: "text",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <TemplateAction id={row.original.id} />,
    enableHiding: false,
  }),
]);
