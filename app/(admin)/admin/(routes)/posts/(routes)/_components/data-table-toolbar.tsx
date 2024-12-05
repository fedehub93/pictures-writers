"use client";

import Link from "next/link";
import { CheckCircle, Circle, PlusCircle, Timer, X } from "lucide-react";
import { ContentStatus } from "@prisma/client";
import { Table } from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

const statuses = [
  {
    value: ContentStatus.DRAFT,
    label: "Draft",
    icon: Circle,
  },
  {
    value: ContentStatus.CHANGED,
    label: "Changed",
    icon: Timer,
  },
  {
    value: ContentStatus.PUBLISHED,
    label: "Published",
    icon: CheckCircle,
  },
];

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter posts..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <Link href="/admin/posts/create">
        <Button role="button" size="default">
          <PlusCircle className="h-4 w-4 mr-2" />
          New post
        </Button>
      </Link>
    </div>
  );
}
