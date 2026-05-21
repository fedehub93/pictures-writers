"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { GetSingleSends } from "../../types";
import { UpdateSingleSendDialog } from "../components/update-single-sends-dialog";

export const SingleSendsView = ({
  singleSends,
}: {
  singleSends: GetSingleSends[];
}) => {
  return (
    <>
      <UpdateSingleSendDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader
          label="Email Single Sends"
          totalEntries={singleSends.length}
        />
        <DataTable columns={columns} data={singleSends} />
      </div>
    </>
  );
};
