"use client";

import Image from "next/image";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarClockIcon } from "lucide-react";

import { ContentStatus } from "@/generated/prisma";

import { cn, getFirstCharUppercase } from "@/shared/lib/utils";

import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import type { PostsGetMany } from "../../../types";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { PostsActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type Post = PostsGetMany["items"][number];

const columnHelper = createColumnHelper<DataTableFeatures, Post>();

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected();
      const isSomeSelected = table.getIsSomePageRowsSelected();

      return (
        <Checkbox
          checked={
            isAllSelected ||
            (isSomeSelected && !isAllSelected && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
          className="translate-y-0.5"
        />
      );
    },
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
  }),
  columnHelper.accessor("imageCover", {
    header: () => <span>Image</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const imageCover = row.original.imageCover;
      if (!imageCover) return null;

      return (
        <div className="relative max-w-60 aspect-video">
          <Image
            src={imageCover.url}
            alt={imageCover.altText ?? ""}
            fill
            sizes="20vw"
            className="rounded-md object-cover"
          />
        </div>
      );
    },
  }),
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("postAuthors", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Authors" />
    ),
    enableSorting: false,
    cell: ({ row }) => {
      const authors = row.original.postAuthors;

      return (
        <div className="flex items-center gap-x-4">
          {authors.map((author) => (
            <Image
              key={author.user.email}
              src={author.user.imageUrl ?? ""}
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
              alt={`Foto profilo ${author.user.email}`}
              unoptimized
            />
          ))}
        </div>
      );
    },
  }),
  columnHelper.accessor("editorType", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Editor Type" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    sortFn: "text",
    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <Badge
          className={cn(
            status === ContentStatus.DRAFT && "bg-slate-700",
            status === ContentStatus.CHANGED && "bg-sky-700",
            status === ContentStatus.PUBLISHED && "bg-emerald-700",
            status === ContentStatus.SCHEDULED && "bg-primary",
          )}
        >
          {getFirstCharUppercase(status.toLowerCase())}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("firstPublishedAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Published at" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => {
      const date = new Date(row.original.firstPublishedAt);
      const formattedDate = date.toLocaleDateString("it-IT", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return <div>{formattedDate}</div>;
    },
  }),
  columnHelper.accessor("scheduledAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Scheduled for" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => {
      const { scheduledAt, status } = row.original;
      if (!scheduledAt) return null;

      const date = new Date(scheduledAt);
      const isOverdue =
        status === ContentStatus.SCHEDULED && date.getTime() < Date.now();

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-2 text-sm",
                  isOverdue
                    ? "font-medium text-destructive"
                    : "text-muted-foreground",
                )}
              >
                <CalendarClockIcon
                  className={cn("size-4", isOverdue && "text-destructive")}
                />
                <span>{format(date, "PP p")}</span>
              </div>
            </TooltipTrigger>
            {isOverdue && (
              <TooltipContent>
                <p>
                  This scheduled publication is overdue and should be reviewed.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { rootId, id, status, scheduledAt } = row.original;

      if (!rootId) return null;

      return (
        <PostsActions
          rootId={rootId}
          id={id}
          status={status}
          scheduledAt={scheduledAt}
        />
      );
    },
    enableHiding: false,
  }),
]);
