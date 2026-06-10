"use client";

import { ArrowDownIcon, PlusCircleIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

import { useOpenTemplate } from "../../hooks/use-open-template";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  data: TData[];
  nameFilterValue: string;
}

export function DataTableToolbar<TData>({
  table,
  nameFilterValue,
}: DataTableToolbarProps<TData>) {
  const [isLoading, _] = useState(false);
  const { onOpen } = useOpenTemplate();

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter templates..."
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
            New template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
