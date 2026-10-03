"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import { DataPagination } from "@/shared/components/data-pagination";

import { useOrderFilters } from "../../hooks/use-orders-filter";
import { useSuspenseOrders } from "../../hooks/use-orders";

import { OrderDialog } from "../components/order-dialog";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

export const OrdersView = () => {
  const [filters, setFilters] = useOrderFilters();
  const { data } = useSuspenseOrders(filters);

  return (
    <>
      <OrderDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
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

export const OrdersViewLoading = () => {
  return (
    <LoadingState
      title="Loading Orders"
      description="This may take a few seconds"
    />
  );
};

export const OrdersViewError = () => {
  return <ErrorState title="Error Orders" description="Something went wrong" />;
};
