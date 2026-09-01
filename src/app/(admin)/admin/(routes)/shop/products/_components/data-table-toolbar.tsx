"use client";

import Link from "next/link";
import {
  ArrowDownIcon,
  BookTextIcon,
  CheckCircleIcon,
  CircleIcon,
  ClipboardPenIcon,
  ExternalLinkIcon,
  HeadsetIcon,
  PencilIcon,
  PlusCircleIcon,
  TimerIcon,
  XIcon,
} from "lucide-react";
import { ContentStatus, ProductType } from "@/generated/prisma";
import { type ReactTable, type RowData } from "@tanstack/react-table";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { API_ADMIN_PRODUCTS_PUBLISH } from "@/constants/api";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { type DataTableFeatures } from "./data-table-features";

interface DataTableToolbarProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
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

const types = [
  {
    value: ProductType.SERVICE,
    label: "Service",
    icon: ClipboardPenIcon,
  },
  {
    value: ProductType.WEBINAR,
    label: "Webinar",
    icon: HeadsetIcon,
  },
  {
    value: ProductType.EBOOK,
    label: "Ebook",
    icon: BookTextIcon,
  },
  {
    value: ProductType.AFFILIATE,
    label: "Affiliate",
    icon: ExternalLinkIcon,
  },
];

export function DataTableToolbar<TData extends RowData>({
  table,
  data,
}: DataTableToolbarProps<TData>) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isFiltered = table.state.columnFilters.length > 0;
  const selectedRows = table.state.rowSelection;

  const onPublishPost = async () => {
    try {
      setIsLoading(true);

      const selectedRecords = Object.keys(selectedRows)
        .filter((key) => selectedRows[key])
        .map((key) => data[Number(key)]);

      await axios.patch(`${API_ADMIN_PRODUCTS_PUBLISH}`, {
        products: selectedRecords,
      });
      toast.success("Items published");

      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Filter products..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-37.5 lg:w-62.5"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
            options={types}
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
          <Link href="/admin/shop/products/create">
            <DropdownMenuItem>
              <PlusCircleIcon />
              New product
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onSelect={onPublishPost}>
            <PencilIcon />
            Publish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
