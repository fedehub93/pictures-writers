"use client";

import { type SetStateAction } from "react";
import { type SortingState } from "@tanstack/react-table";

import { DataPagination } from "@/shared/components/data-pagination";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useCategoriesFilters } from "../../hooks/use-categories-filters";
import { useSuspenseCategories } from "../../hooks/use-categories";
import { CATEGORY_LIST_SORTS, DEFAULT_PAGE } from "../../constants";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreateCategoryDialog } from "../components/create-category-dialog";

export const CategoriesView = () => {
  const [filters, setFilters] = useCategoriesFilters();
  const { data } = useSuspenseCategories(filters);

  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.direction === "desc" }]
    : [];

  const onSortingChange = (updater: SetStateAction<SortingState>) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const sort = next[0];
    setFilters({
      sort: sort ? (sort.id as (typeof CATEGORY_LIST_SORTS)[number]) : null,
      direction: sort ? (sort.desc ? "desc" : "asc") : null,
      page: DEFAULT_PAGE,
    });
  };

  return (
    <>
      <CreateCategoryDialog />
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

export const CategoriesViewLoading = () => {
  return (
    <LoadingState
      title="Loading Categories"
      description="This may take a few seconds"
    />
  );
};

export const CategoriesViewError = () => {
  return (
    <ErrorState title="Error Categories" description="Something went wrong" />
  );
};
