"use client";

import { ContentStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";

import { cn } from "@/lib/utils";

type PostWithImageCoverAndAuthor = {
  id: string;
  rootId: string | null;
  title: string;
  slug: string;
  status: ContentStatus;
  publishedAt: Date;
  firstPublishedAt: Date;
  imageCover: {
    url: string;
    altText: string | null;
  } | null;
  postAuthors: {
    user: {
      email: string | null;
      imageUrl: string | null;
    } | null;
  }[];
};

export const columns: ColumnDef<PostWithImageCoverAndAuthor>[] = [
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
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
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
            className="rounded-md object-cover"
            unoptimized
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
            status === ContentStatus.PUBLISHED && "bg-emerald-700"
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
          <ArrowUpDown className="ml-2 h-4 w-4" />
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
    id: "actions",
    cell: ({ row }) => {
      const { rootId } = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-4 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/admin/posts/${rootId}`}>
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
