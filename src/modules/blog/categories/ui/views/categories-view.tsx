"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useCategoriesFilters } from "../../hooks/use-categories-filters";
import { useSuspenseCategories } from "../../hooks/use-categories";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreateCategoryDialog } from "../components/create-category-dialog";
import { DataPagination } from "@/shared/components/data-pagination";

export const CategoriesView = () => {
  const [filters, setFilters] = useCategoriesFilters();
  const { data } = useSuspenseCategories(filters);
  return (
    <>
      <CreateCategoryDialog />
      <div className="px-6">
        <DataTable columns={columns} data={data.items} />
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
