"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { CreateSingleSendDialog } from "../components/create-single-send-dialog";
import { useSuspenseSingleSends } from "../../hooks/use-single-sends";

export const SingleSendsView = () => {
  const { data } = useSuspenseSingleSends();
  return (
    <>
      <CreateSingleSendDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader label="Email Single Sends" totalEntries={data.length} />
        <DataTable columns={columns} data={data} />
      </div>
    </>
  );
};

export const SingleSendsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Single Sends"
      description="This may take a few seconds"
    />
  );
};

export const SingleSendsViewError = () => {
  return (
    <ErrorState title="Error Single Sends" description="Something went wrong" />
  );
};
