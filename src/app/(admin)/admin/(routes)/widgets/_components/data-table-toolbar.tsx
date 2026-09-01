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
import { WidgetSection } from "@/generated/prisma";
import { type ReactTable, type RowData } from "@tanstack/react-table";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { type DataTableFeatures } from "./data-table-features";

interface DataTableToolbarProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
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

export function DataTableToolbar<TData extends RowData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.state.columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center gap-2">
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
            <X data-icon="inline-end" />
          </Button>
        )}
      </div>
      <Link href="/admin/widgets/create">
        <Button role="button">
          <PlusCircle data-icon="inline-start" />
          New widget
        </Button>
      </Link>
    </div>
  );
}
