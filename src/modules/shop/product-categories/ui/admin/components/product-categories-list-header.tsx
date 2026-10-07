"use client";

import { ArrowDownIcon, PlusCircleIcon, XCircleIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DEFAULT_PAGE } from "../../../constants";
import { useOpenProductCategory } from "../../../hooks/use-open-product-category";
import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

import { ProductCategoriesSearchFilter } from "./product-categories-search-filter";
import { ProductCategoriesStatusFilter } from "./product-categories-status-filter";

export const ProductCategoriesListHeader = () => {
  const [filters, setFilters] = useProductCategoriesFilters();
  const { onOpen } = useOpenProductCategory();
  const canCreate = usePermission(PERMISSIONS.PRODUCT_CATEGORIES_CREATE);
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.productCategories.getMany.queryOptions(filters),
  );

  const isAnyFilterModified = !!filters.search || !!filters.status;

  const onClearFilters = () => {
    setFilters({
      search: "",
      page: DEFAULT_PAGE,
      status: null,
    });
  };

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader
        label="Product Categories"
        totalEntries={data?.total ?? 0}
      />
      <div className="flex justify-between">
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <ProductCategoriesSearchFilter />
            <ProductCategoriesStatusFilter />
            {isAnyFilterModified && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-8"
              >
                <XCircleIcon data-icon="inline-start" />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {canCreate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                Actions
                <ArrowDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen()}>
                <PlusCircleIcon />
                New product category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
