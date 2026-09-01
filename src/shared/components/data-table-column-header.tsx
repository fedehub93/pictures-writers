"use client";

import * as React from "react";
import { type Column, type RowData, type TableFeatures } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type SortableColumn<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue,
> = Column<TFeatures, TData, TValue> & {
  getCanSort: () => boolean;
  getIsSorted: () => "asc" | "desc" | false;
  toggleSorting: (desc?: boolean, multi?: boolean) => void;
};

interface DataTableColumnHeaderProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: SortableColumn<TFeatures, TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue,
>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TFeatures, TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8", className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      {column.getIsSorted() === "desc" ? (
        <ArrowDownIcon data-icon="inline-end" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUpIcon data-icon="inline-end" />
      ) : (
        <ArrowUpDownIcon data-icon="inline-end" />
      )}
    </Button>
  );
}
