"use client";

import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";

import { ArrowUpDownIcon, CalendarClockIcon } from "lucide-react";
import { format } from "date-fns";

import { ContentStatus } from "@/generated/prisma";

import { cn, getFirstCharUppercase } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import type { PostsGetMany } from "../../../types";

import { PostsActions } from "./actions";

export const columns: ColumnDef<PostsGetMany[number]>[] = [
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
    accessorKey: "imageCover",
    header: () => {
      return <span>Image</span>;
    },
    cell: ({ row }) => {
      const imageCover = (row.getValue("imageCover") || null) as {
        url: string;
        altText: string | null;
      } | null;
      if (!imageCover) return null;
      return (
        <div className="relative max-w-60 aspect-video">
          <Image
            src={imageCover.url}
            alt={imageCover.altText || ""}
            fill
            sizes="20vw"
            className="rounded-md object-cover"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Title
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "postAuthors",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Authors
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const authors = row.getValue("postAuthors") as {
        user: { email: string; imageUrl: string | null };
      }[];

      return (
        <div className="flex items-center gap-x-4">
          {authors.map((a) => {
            return (
              <Image
                key={a.user.email}
                src={a.user.imageUrl!}
                width={40}
                height={40}
                className="rounded-full w-10 h-10 object-cover"
                alt={`Foto profilo ${a.user.email}`}
                unoptimized
              />
            );
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "editorType",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Editor Type
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Status
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "firstPublishedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Published at
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const { firstPublishedAt } = row.original;
      const date = new Date(firstPublishedAt);
      const formattedDate = date.toLocaleDateString("it-IT", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      return <div>{formattedDate}</div>;
    },
  },
  {
    accessorKey: "scheduledAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Scheduled for
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { rootId, id, status } = row.original;

      if (!rootId) return null;
      return (
        <PostsActions
          rootId={rootId}
          id={id}
          status={status}
          scheduledAt={row.original.scheduledAt}
        />
      );
    },
  },
];
