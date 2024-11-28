"use client";

import { ContentStatus, Media, Product, ProductCategory } from "@prisma/client";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { ProductsAction } from "./actions";

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "imageCover",
    header: () => {
      return <span>Image</span>;
    },
    cell: ({ row }) => {
      const imageCover = (row.getValue("imageCover") || null) as Media | null;
      if (!imageCover) return null;
      return (
        <div className="relative h-20 aspect-[1/2]">
          <Image
            src={imageCover.url}
            alt={imageCover.altText || ""}
            fill
            className="rounded-md object-contain"
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
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const category = row.getValue("category") || false;
      return (
        <Badge>
          {category === ProductCategory.EBOOK
            ? "Ebook"
            : category === ProductCategory.SERVICE
            ? "Service"
            : "None"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = (row.getValue("price") || 0.0) as number;
      return <span className="font-extrabold">{formatPrice(price, true)}</span>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { rootId, id } = row.original;
      return <ProductsAction rootId={rootId!} id={id} />;
    },
  },
];
