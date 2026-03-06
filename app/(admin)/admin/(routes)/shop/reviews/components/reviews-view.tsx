"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { UpdateReviewDialog } from "./update-review-dialog";

export const ReviewsView = ({ reviews }: { reviews: any[] }) => {
  return (
    <>
      <UpdateReviewDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <ContentHeader label="Reviews" totalEntries={reviews.length} />
        <DataTable columns={columns} data={reviews} />
      </div>
    </>
  );
};
