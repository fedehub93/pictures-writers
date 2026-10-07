"use client";

import { DataPagination } from "@/shared/components/data-pagination";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspenseProductCategories } from "../../../hooks/use-product-categories";
import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { ProductCategoryDialog } from "../components/product-category-dialog";

export const ProductCategoriesView = () => {
  const [filters, setFilters] = useProductCategoriesFilters();
  const { data } = useSuspenseProductCategories(filters);

  return (
    <>
      <ProductCategoryDialog />
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

export const ProductCategoriesViewLoading = () => {
  return (
    <LoadingState
      title="Loading Product Categories"
      description="This may take a few seconds"
    />
  );
};

export const ProductCategoriesViewError = () => {
  return (
    <ErrorState
      title="Error Product Categories"
      description="Something went wrong"
    />
  );
};
