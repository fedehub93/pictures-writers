"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspenseTemplates } from "../../hooks/use-templates";

import { CreateTemplateDialog } from "../components/create-template-dialog";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

export const TemplatesView = () => {
  const { data } = useSuspenseTemplates();
  return (
    <>
      <CreateTemplateDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader label="Email Templates" totalEntries={data.length} />
        <DataTable columns={columns} data={data} />
      </div>
    </>
  );
};

export const TemplatesViewLoading = () => {
  return (
    <LoadingState
      title="Loading Templates"
      description="This may take a few seconds"
    />
  );
};

export const TemplatesViewError = () => {
  return (
    <ErrorState title="Error Templates" description="Something went wrong" />
  );
};
