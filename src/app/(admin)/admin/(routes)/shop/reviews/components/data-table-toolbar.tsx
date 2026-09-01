"use client";

import {
  ArrowDownIcon,
  CheckCircleIcon,
  CircleIcon,
  PlusCircleIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { type ReactTable, type RowData } from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { useOpenReview } from "../hooks/use-open-review";
import { type DataTableFeatures } from "./data-table-features";

interface DataTableToolbarProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  data: TData[];
}

const statuses = [
  {
    value: false,
    label: "Unpublished",
    icon: CircleIcon,
  },
  {
    value: true,
    label: "Published",
    icon: CheckCircleIcon,
  },
];

export function DataTableToolbar<TData extends RowData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [isLoading, _] = useState(false);
  const { onOpen } = useOpenReview();

  const isFiltered = table.state.columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center gap-2">
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
            <XIcon data-icon="inline-end" />
          </Button>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLoading}>
          <Button type="button" variant="outline" size="sm">
            Actions
            <ArrowDownIcon data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onOpen()}>
            <PlusCircleIcon />
            New review
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
