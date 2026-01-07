"use client";

import { AudienceType, EmailAudience } from "@/prisma/generated/client";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
              type === AudienceType.GLOBAL && "fill-slate-700"
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
