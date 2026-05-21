"use client";

import {
  ArrowDownIcon,
  CheckCircleIcon,
  CircleIcon,
  PencilIcon,
  PlusCircleIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Table } from "@tanstack/react-table";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { useOpenReview } from "../hooks/use-open-review";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
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

export function DataTableToolbar<TData>({
  table,
  data,
}: DataTableToolbarProps<TData>) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { onOpen } = useOpenReview();

  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRows = table.getState().rowSelection;

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
            <XIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLoading}>
          <Button type="button" variant="outline" size="sm">
            Actions
            <ArrowDownIcon className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onOpen()}>
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            New review
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
