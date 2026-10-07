"use client";

import { type SetStateAction } from "react";
import { type SortingState } from "@tanstack/react-table";

import { DataPagination } from "@/shared/components/data-pagination";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspenseProducts } from "../../../hooks/use-products";
import { useProductsFilters } from "../../../hooks/use-products-filters";
import { DEFAULT_PAGE, PRODUCT_LIST_SORTS } from "../../../constants";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { ProductDialog } from "../components/product-dialog";

export const ProductsView = () => {
  const [filters, setFilters] = useProductsFilters();
  const { data } = useSuspenseProducts(filters);

  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.direction === "desc" }]
    : [];

  const onSortingChange = (updater: SetStateAction<SortingState>) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const sort = next[0];
    setFilters({
      sort: sort ? (sort.id as (typeof PRODUCT_LIST_SORTS)[number]) : null,
      direction: sort ? (sort.desc ? "desc" : "asc") : null,
      page: DEFAULT_PAGE,
    });
  };

  return (
    <>
      <ProductDialog />
      <div className="px-6">
        <DataTable
          columns={columns}
          data={data.items}
          sorting={sorting}
          onSortingChange={onSortingChange}
        />
        <DataPagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
        />
      </div>
    </>
  );
};

export const ProductsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Products"
      description="This may take a few seconds"
    />
  );
};

export const ProductsViewError = () => {
  return (
    <ErrorState
      title="Error Products"
      description="Something went wrong"
    />
  );
};
