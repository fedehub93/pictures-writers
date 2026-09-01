"use client";

import { ArrowDownIcon, PlusCircleIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { type ReactTable, type RowData } from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

import { useOpenForm } from "../../hooks/use-open-form";

import { type DataTableFeatures } from "./data-table-features";

interface DataTableToolbarProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  data: TData[];
  nameFilterValue: string;
}

export function DataTableToolbar<TData extends RowData>({
  table,
  nameFilterValue,
}: DataTableToolbarProps<TData>) {
  const [isLoading, _] = useState(false);
  const { onOpen } = useOpenForm();

  const isFiltered = table.state.columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Filter forms..."
          value={nameFilterValue}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-37.5 lg:w-62.5"
        />
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
            New form
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
