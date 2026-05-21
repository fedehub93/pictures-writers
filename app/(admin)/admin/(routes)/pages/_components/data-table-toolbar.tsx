"use client";

import {
  ArrowDownIcon,
  CheckCircleIcon,
  CircleIcon,
  PlusCircleIcon,
  TimerIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOpenPage } from "../_hooks/use-open-page";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { ContentStatus } from "@/generated/prisma";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  data: TData[];
}

const statuses = [
  {
    value: ContentStatus.DRAFT,
    label: "Draft",
    icon: CircleIcon,
  },
  {
    value: ContentStatus.CHANGED,
    label: "Changed",
    icon: TimerIcon,
  },
  {
    value: ContentStatus.PUBLISHED,
    label: "Published",
    icon: CheckCircleIcon,
  },
];

export function DataTableToolbar<TData>({
  table,
  data,
}: DataTableToolbarProps<TData>) {
  const [isLoading, _] = useState(false);
  const { onOpen } = useOpenPage();

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center space-x-2">
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
            <XIcon className="ml-2 size-4" />
          </Button>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLoading}>
          <Button type="button" variant="outline" size="sm">
            Actions
            <ArrowDownIcon className="size-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onOpen()}>
            <PlusCircleIcon className="size-4 mr-2" />
            New page
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
