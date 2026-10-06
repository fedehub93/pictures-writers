"use client";

import { DataPagination } from "@/shared/components/data-pagination";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useSuspenseReviews } from "../../../hooks/use-reviews";
import { useReviewsFilters } from "../../../hooks/use-reviews-filters";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { ReviewDialog } from "../components/review-dialog";

export const ReviewsView = () => {
  const [filters, setFilters] = useReviewsFilters();
  const { data } = useSuspenseReviews(filters);

  return (
    <>
      <ReviewDialog />
      <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
        <DataTable columns={columns} data={data.items} />
        <DataPagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
        />
      </div>
    </>
  );
};

export const ReviewsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Reviews"
      description="This may take a few seconds"
    />
  );
};

export const ReviewsViewError = () => {
  return <ErrorState title="Error Reviews" description="Something went wrong" />;
};
