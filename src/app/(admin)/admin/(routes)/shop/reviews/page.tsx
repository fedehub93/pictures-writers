import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  ReviewsView,
  ReviewsViewError,
  ReviewsViewLoading,
} from "@/modules/reviews/ui/admin/views/reviews-view";
import { ReviewsListHeader } from "@/modules/reviews/ui/admin/components/reviews-list-header";
import { loadSearchParams } from "@/modules/reviews/params";
import { prefetchReviews } from "@/modules/reviews/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const ReviewsPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.REVIEWS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchReviews(filters);

  return (
    <HydrateClient>
      <ReviewsListHeader />
      <Suspense fallback={<ReviewsViewLoading />}>
        <ErrorBoundary fallback={<ReviewsViewError />}>
          <ReviewsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default ReviewsPage;
