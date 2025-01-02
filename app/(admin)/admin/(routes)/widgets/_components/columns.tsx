"use client";

import {
  ContentStatus,
  Media,
  Post,
  User,
  Widget,
  WidgetSection,
  WidgetType,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle,
  CircleOff,
  MoreHorizontal,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { WidgetActions } from "./actions";

export const columns: ColumnDef<Widget>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "section",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Section
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const section = row.getValue("section") as string;
      return <Badge>{section}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const type = (row.getValue("type") as string) || false;
      return <Badge>{type}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "isEnabled",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Is enabled?
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isEnabled = row.getValue("isEnabled") || false;
      if (isEnabled) return <CheckCircle className="text-emerald-700" />;
      return <CircleOff className="text-destructive" />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return <WidgetActions id={id} />;
    },
  },
];
