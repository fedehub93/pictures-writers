"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { useSuspenseContacts } from "../../hooks/use-contacts";
import { UpdateContactDialog } from "../components/update-contact-dialog";

export const ContactsView = ({ audienceId }: { audienceId: string }) => {
  const { data } = useSuspenseContacts({ audienceId });
  return (
    <>
      <UpdateContactDialog audienceId={audienceId} />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader label="Contacts" totalEntries={data.length} />
        <DataTable audienceId={audienceId} columns={columns} data={data} />
      </div>
    </>
  );
};

export const ContactsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Contacts"
      description="This may take a few seconds"
    />
  );
};

export const ContactsViewError = () => {
  return (
    <ErrorState title="Error Contacts" description="Something went wrong" />
  );
};
