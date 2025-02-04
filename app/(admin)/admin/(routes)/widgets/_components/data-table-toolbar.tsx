"use client";

import Link from "next/link";
import {
  AppWindow,
  Captions,
  PanelBottom,
  PanelRight,
  PlusCircle,
  X,
} from "lucide-react";
import { WidgetSection } from "@prisma/client";
import { Table } from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

const sections = [
  {
    value: WidgetSection.HERO,
    label: "Hero",
    icon: Captions,
  },
  {
    value: WidgetSection.MODAL_POPUP,
    label: "Pop-up",
    icon: AppWindow,
  },
  {
    value: WidgetSection.POST_SIDEBAR,
    label: "Post Sidebar",
    icon: PanelRight,
  },
  {
    value: WidgetSection.POST_BOTTOM,
    label: "Post Bottom",
    icon: PanelBottom,
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
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("section") && (
          <DataTableFacetedFilter
            column={table.getColumn("section")}
            title="Section"
            options={sections}
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
      <Link href="/admin/widgets/create">
        <Button role="button" size="default">
          <PlusCircle className="h-4 w-4 mr-2" />
          New widget
        </Button>
      </Link>
    </div>
  );
}
