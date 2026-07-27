"use client";

import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";

import { DataTable } from "../components/data-table";
import { columns } from "../components/column";
import { useSuspenseFormSubmissions } from "../../hooks/use-submissions";
import { useSubmissionsFilters } from "../../hooks/use-submissions-filters";

export const FormSubmissionsView = () => {
  const [filters, setFilters] = useSubmissionsFilters();

  const { data } = useSuspenseFormSubmissions(filters);

  return (
    <div className="px-6">
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export const FormSubmissionsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Submissions"
      description="This may take a few seconds"
    />
  );
};

export const FormSubmissionsViewError = () => {
  return (
    <ErrorState title="Error Submissions" description="Something went wrong" />
  );
};
