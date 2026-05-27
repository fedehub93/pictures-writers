"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { useSuspenseAudiences } from "../../hooks/use-audiences";
import { UpdateAudienceDialog } from "../components/update-audience-dialog";

export const AudiencesView = () => {
  const { data } = useSuspenseAudiences();
  return (
    <>
      <UpdateAudienceDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader label="Email Audiences" totalEntries={data.length} />
        <DataTable columns={columns} data={data} />
      </div>
    </>
  );
};

export const AudiencesViewLoading = () => {
  return (
    <LoadingState
      title="Loading Audiences"
      description="This may take a few seconds"
    />
  );
};

export const AudiencesViewError = () => {
  return (
    <ErrorState title="Error Audiences" description="Something went wrong" />
  );
};
