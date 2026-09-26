"use client";

import { DataPagination } from "@/shared/components/data-pagination";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { CreateCredentialDialog } from "../components/create-credential-dialog";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useCredentialsFilters } from "../../hooks/use-credentials-filters";
import { useSuspenseCredentials } from "../../hooks/use-credentials";

export const CredentialsView = () => {
  const [filters, setFilters] = useCredentialsFilters();
  const { data } = useSuspenseCredentials(filters);

  return (
    <>
      <CreateCredentialDialog />
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

export const CredentialsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Credentials"
      description="This may take a few seconds"
    />
  );
};

export const CredentialsViewError = () => {
  return (
    <ErrorState title="Error Credentials" description="Something went wrong" />
  );
};
