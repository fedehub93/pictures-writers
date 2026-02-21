"use client";

import { Media, User, UserRole } from "@/generated/prisma";
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
import { cn } from "@/lib/utils";
import { Actions } from "./actions";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "imageUrl",
    header: () => {
      return <span>Image</span>;
    },
    cell: ({ row }) => {
      const imageUrl = (row.getValue("imageUrl") || null) as string | null;
      if (!imageUrl) return null;
      return (
        <div className="relative w-20 aspect-square">
          <Image
            src={imageUrl}
            alt={"Photo profile"}
            fill
            className="rounded-md object-cover"
            unoptimized
          />
        </div>
      );
    },
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const role = (row.getValue("role") as UserRole) || UserRole.USER;
      return (
        <Badge
          className={cn(
            "bg-slate-500",
            role === UserRole.ADMIN && "bg-sky-700"
          )}
        >
          {role || ""}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id, firstName, lastName, imageUrl, role, bio } = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-4 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <Actions
            id={id}
            firstName={firstName}
            lastName={lastName}
            imageUrl={imageUrl}
            role={role}
            bio={bio}
          />
        </DropdownMenu>
      );
    },
  },
];
