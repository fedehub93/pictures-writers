"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { UpdatePageDialog } from "./update-page-dialog";
import { GetPagesGroupedByRootId } from "../data";

export const PagesView = ({ pages }: { pages: GetPagesGroupedByRootId[] }) => {
  return (
    <>
      <UpdatePageDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader label="Pages" totalEntries={pages.length} />
        <DataTable columns={columns} data={pages} />
      </div>
    </>
  );
};
