"use client";

import { Format, Genre, Impression, Media } from "@/generated/prisma";
import { createColumnHelper } from "@tanstack/react-table";
import { Download, MoreHorizontal } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { type DataTableFeatures } from "./data-table-features";

type ImpressionWithFile = Impression & {
  file: Media | null;
  format: Format | null;
  genre: Genre | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, ImpressionWithFile>();

export const columns = columnHelper.columns([
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("format", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Format" />
    ),
    enableSorting: false,
    cell: ({ row }) => {
      const format = row.original.format;
      if (!format) return null;
      return <div>{format.title}</div>;
    },
  }),
  columnHelper.accessor("genre", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Genre" />
    ),
    enableSorting: false,
    cell: ({ row }) => {
      const genre = row.original.genre;
      if (!genre) return null;
      return <div>{genre.title}</div>;
    },
  }),
  columnHelper.accessor("firstName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("lastName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    sortFn: "text",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { file } = row.original;
      return (
        <div className="flex gap-x-2">
          {file && (
            <a href={`${file.url}`} target="_blank">
              <Download />
            </a>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" />
          </DropdownMenu>
        </div>
      );
    },
    enableHiding: false,
  }),
]);
