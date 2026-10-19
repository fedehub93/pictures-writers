"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { MAIL_SECTIONS } from "@/modules/mails/lib/sections";

import { EmailAccountDialog } from "../components/account-dialog";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";

import { useSuspenseEmailAccounts } from "../../hooks/use-accounts";

export const EmailAccountsView = () => {
  const { data } = useSuspenseEmailAccounts();

  return (
    <>
      <EmailAccountDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader
          label="Email Accounts"
          totalEntries={data.length}
          section={MAIL_SECTIONS.conversations}
        />
        <DataTable columns={columns} data={data} />
      </div>
    </>
  );
};

export const EmailAccountsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Email Accounts"
      description="This may take a few seconds"
    />
  );
};

export const EmailAccountsViewError = () => {
  return (
    <ErrorState
      title="Error Email Accounts"
      description="Something went wrong"
    />
  );
};
