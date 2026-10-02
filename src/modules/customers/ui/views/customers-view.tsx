"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import { DataPagination } from "@/shared/components/data-pagination";

import { useCustomerFilters } from "../../hooks/use-customers-filter";
import { useSuspenseCustomers } from "../../hooks/use-customers";

import { CustomerDialog } from "../components/customer-dialog";
import { CustomersListHeader } from "../components/customers-list-header";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

export const CustomersView = () => {
  const [filters, setFilters] = useCustomerFilters();
  const { data } = useSuspenseCustomers(filters);

  return (
    <>
      <CustomerDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <CustomersListHeader totalEntries={data.total} />
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

export const CustomersViewLoading = () => {
  return (
    <LoadingState
      title="Loading Customers"
      description="This may take a few seconds"
    />
  );
};

export const CustomersViewError = () => {
  return (
    <ErrorState title="Error Customers" description="Something went wrong" />
  );
};
