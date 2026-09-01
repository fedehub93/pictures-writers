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

import { SingleSendsGetMany } from "../../types";
import { type DataTableFeatures } from "./data-table-features";

type SingleSend = SingleSendsGetMany[number];

const columnHelper = createColumnHelper<DataTableFeatures, SingleSend>();

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("subject", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("totalContacts", {
    header: "Total Contacts",
    sortFn: "alphanumeric",
  }),
  columnHelper.accessor("totalSends", {
    header: "Total Sends",
    sortFn: "alphanumeric",
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
            <Link href={`/admin/mails/single-sends/${id}`}>
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
