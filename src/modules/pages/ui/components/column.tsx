"use client";

import { ColumnDef } from "@tanstack/react-table";

import { ArrowUpDownIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";

import type { PagesGetMany } from "../../types";

import { PagesActions } from "./actions";
import { formatDate } from "@/lib/format";
import { Badge } from "@/shared/ui/badge";
import { ContentStatus } from "@/generated/prisma";
import { cn } from "@/shared/lib/utils";

export const columns: ColumnDef<PagesGetMany[number]>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDownIcon className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "slug",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Slug
          <ArrowUpDownIcon className="ml-2 size-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDownIcon className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = formatDate({ date: row.original.createdAt });
      return <div>{date}</div>;
    },
  },

  {
    accessorKey: "status",
    filterFn: (row, id, value) => {
      if (!value?.length) return true;
      return value.includes(row.getValue(id));
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDownIcon className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") || false;
      return (
        <Badge
          className={cn(
            status === ContentStatus.DRAFT && "bg-slate-700",
            status === ContentStatus.CHANGED && "bg-sky-700",
            status === ContentStatus.PUBLISHED && "bg-emerald-700",
          )}
        >
          {status === ContentStatus.DRAFT
            ? "Draft"
            : status === ContentStatus.CHANGED
              ? "Changed"
              : "Published"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { rootId, id, status } = row.original;
      if (!rootId) return null;
      return (
        <PagesActions
          rootId={rootId}
          id={id}
          status={status}
          data={row.original}
        />
      );
    },
  },
];
