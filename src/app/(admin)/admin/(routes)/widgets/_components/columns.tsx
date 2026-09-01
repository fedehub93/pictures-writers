"use client";

import { Widget } from "@/generated/prisma";
import { createColumnHelper } from "@tanstack/react-table";
import { CheckCircle, CircleOff } from "lucide-react";

import { Badge } from "@/shared/ui/badge";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { WidgetActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

const columnHelper = createColumnHelper<DataTableFeatures, Widget>();

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("section", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Section" />
    ),
    sortFn: "text",
    filterFn: "arrIncludes",
    cell: ({ row }) => {
      const section = row.original.section;
      return <Badge>{section}</Badge>;
    },
  }),
  columnHelper.accessor("type", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    sortFn: "text",
    filterFn: "arrIncludes",
    cell: ({ row }) => {
      const type = row.original.type;
      return <Badge>{type}</Badge>;
    },
  }),
  columnHelper.accessor("isEnabled", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Is enabled?" />
    ),
    sortFn: "alphanumeric",
    cell: ({ row }) => {
      const isEnabled = row.original.isEnabled;
      if (isEnabled) return <CheckCircle className="text-emerald-700" />;
      return <CircleOff className="text-destructive" />;
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return <WidgetActions id={id} />;
    },
    enableHiding: false,
  }),
]);
