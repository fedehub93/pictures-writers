"use client";

import { User, UserRole } from "@/generated/prisma";
import Image from "next/image";
import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { Actions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

const columnHelper = createColumnHelper<DataTableFeatures, User>();

export const columns = columnHelper.columns([
  columnHelper.accessor("imageUrl", {
    header: () => <span>Image</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
      if (!imageUrl) return null;
      return (
        <div className="relative aspect-square w-20">
          <Image
            src={imageUrl}
            alt="Photo profile"
            fill
            className="rounded-md object-cover"
            unoptimized
          />
        </div>
      );
    },
  }),
  columnHelper.accessor("firstName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First name" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("lastName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last name" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    sortFn: "text",
    filterFn: "includesString",
  }),
  columnHelper.accessor("role", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    sortFn: "text",
    cell: ({ row }) => {
      const role = row.original.role || UserRole.USER;
      return (
        <Badge
          className={cn("bg-slate-500", role === UserRole.ADMIN && "bg-sky-700")}
        >
          {role || ""}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id, firstName, lastName, imageUrl, bio } = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <Actions
            id={id}
            firstName={firstName}
            lastName={lastName}
            imageUrl={imageUrl}
            bio={bio}
          />
        </DropdownMenu>
      );
    },
    enableHiding: false,
  }),
]);
