"use client";

import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DataTable } from "../components/data-table";
import { useSuspenseForms } from "../../hooks/use-forms";
import { columns } from "../components/column";
import { UpdateFormDialog } from "../components/update-form-dialog";
import { useFormFilters } from "../../hooks/use-forms-filter";

export const FormsView = () => {
  const [filters, setFilters] = useFormFilters();
  const { data } = useSuspenseForms(filters);

  return (
    <>
      <UpdateFormDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader label="Forms" totalEntries={data.length} />
        <DataTable columns={columns} data={data} />
      </div>
    </>
  );
};

export const FormsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Forms"
      description="This may take a few seconds"
    />
  );
};

export const FormsViewError = () => {
  return <ErrorState title="Error Forms" description="Something went wrong" />;
};
