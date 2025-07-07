"use client";

import { Contest, Media } from "@prisma/client";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import { ContestsAction } from "./actions";

export const columns: ColumnDef<Contest>[] = [
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
    accessorKey: "organization",
    header: () => {
      return <span>Organization</span>;
    },
    cell: ({ row }) => {
      const organization = (row.getValue("organization") || null) as {
        name: string;
        logo: Media | null;
      } | null;
      if (!organization) return null;
      return (
        <div className="flex items-center gap-x-4">
          <div className="relative w-16 h-16 bg-secondary aspect-square rounded-full">
            <Image
              src={organization.logo?.url!}
              alt={organization.logo?.altText || ""}
              fill
              className="rounded-md object-cover"
              unoptimized
            />
          </div>
          {organization.name}
        </div>
      );
    },
  },
  {
    accessorKey: "nextDeadline",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Next Deadline
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const { nextDeadline } = row.original;
      if (!nextDeadline) return <div>No deadline</div>;
      const date = new Date(nextDeadline);
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
      const { rootId, id } = row.original;
      return <ContestsAction rootId={rootId!} id={id} />;
    },
  },
];
