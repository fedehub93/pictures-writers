"use client";

import { AdCampaign } from "@/generated/prisma";
import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontalIcon, PencilIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { type DataTableFeatures } from "./data-table-features";

const columnHelper = createColumnHelper<DataTableFeatures, AdCampaign>();

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("isActive", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    sortFn: "alphanumeric",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge className={cn("bg-slate-700", isActive && "bg-emerald-700")}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <span className="sr-only">Open menu</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/admin/ads/${id}`}>
              <DropdownMenuItem>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  }),
]);
