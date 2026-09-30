"use client";

import { DataPagination } from "@/shared/components/data-pagination";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspenseAutomations } from "../../../hooks/use-automations";
import { useAutomationsFilters } from "../../../hooks/use-automations-filters";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreateAutomationDialog } from "../components/create-automation-dialog";

export const AutomationsView = () => {
  const [filters, setFilters] = useAutomationsFilters();
  const { data } = useSuspenseAutomations(filters);

  return (
    <>
      <CreateAutomationDialog />
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

export const AutomationsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Automations"
      description="This may take a few seconds"
    />
  );
};

export const AutomationsViewError = () => {
  return (
    <ErrorState title="Error Automations" description="Something went wrong" />
  );
};