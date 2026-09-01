"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { AudienceType } from "@/generated/prisma";

import { cn } from "@/shared/lib/utils";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { AudiencesAction } from "./actions";
import { AudiencesGetMany } from "../../types";
import { type DataTableFeatures } from "./data-table-features";

type Audience = AudiencesGetMany[number];

const columnHelper = createColumnHelper<DataTableFeatures, Audience>();

export const columns = columnHelper.columns([
  columnHelper.accessor("type", {
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => {
      const { type } = row.original;
      return (
        <svg height={20} width={20}>
          <circle
            r={5}
            cx={10}
            cy={10}
            className={cn(
              "fill-emerald-500",
              type === AudienceType.GLOBAL && "fill-slate-700",
            )}
          />
        </svg>
      );
    },
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("totalContacts", {
    header: "Count",
    sortFn: "alphanumeric",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id, type } = row.original;
      const isAllContactsAudience = type === AudienceType.GLOBAL;

      return (
        <AudiencesAction
          id={id}
          data={row.original}
          isAllContactsAudience={isAllContactsAudience}
        />
      );
    },
    enableHiding: false,
  }),
]);
