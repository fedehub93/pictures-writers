"use client";

import { DataPagination } from "@/shared/components/data-pagination";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspenseProducts } from "../../../hooks/use-products";
import { useProductsFilters } from "../../../hooks/use-products-filters";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { ProductDialog } from "../components/product-dialog";

export const ProductsView = () => {
  const [filters, setFilters] = useProductsFilters();
  const { data } = useSuspenseProducts(filters);

  return (
    <>
      <ProductDialog />
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
