"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDownIcon } from "lucide-react";

import { AudienceType, EmailAudience } from "@/generated/prisma";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { AudiencesAction } from "./actions";

export const columns: ColumnDef<EmailAudience & { totalContacts: number }>[] = [
  {
    accessorKey: "type",
    header: "Type",
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
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDownIcon className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "totalContacts",
    header: "Count",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id, type } = row.original;

      const isAllContactsAudience = type === AudienceType.GLOBAL;

      return (
        <AudiencesAction
          id={id}
          isAllContactsAudience={isAllContactsAudience}
        />
      );
    },
  },
];
