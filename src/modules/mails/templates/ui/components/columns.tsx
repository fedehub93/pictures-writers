"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontalIcon, PencilIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { TemplatesGetMany } from "../../types";
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
            <Link href={`/admin/mails/templates/${id}`}>
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
