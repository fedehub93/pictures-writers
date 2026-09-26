"use client";

import { AutomationRunStatus } from "@/generated/prisma";

import { cn } from "@/shared/lib/utils";

import { DataPagination } from "@/shared/components/data-pagination";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import {
  useExecutionsFilters,
  useSuspenseAutomationRuns,
} from "../../hooks/use-executions";

import { DataTable } from "../components/data-table";
import { getRunColumns } from "../components/columns";

export const ExecutionsView = ({ automationId }: { automationId: string }) => {
  const [filters, setFilters] = useExecutionsFilters();
  const { data } = useSuspenseAutomationRuns(automationId, filters);
  const columns = getRunColumns(automationId);

  return (
    <div className="px-6">
      <DataTable
        columns={columns}
        data={data.items}
        rowClassName={(run) =>
          cn(run.status === AutomationRunStatus.FAILED && "bg-destructive/5")
        }
      />
      <DataPagination
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
    </div>
  );
};

export const ExecutionsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Executions"
      description="This may take a few seconds"
    />
  );
};

export const ExecutionsViewError = () => {
  return (
    <ErrorState title="Error Executions" description="Something went wrong" />
  );
};
