import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import {
  CategoryIdView,
  CategoryIdViewError,
  CategoryIdViewLoading,
} from "@/modules/blog/categories";
import { prefetchCategoryById } from "@/modules/blog/categories/server/prefetch";

const CategoryIdPage = async ({
  params,
}: {
  params: Promise<{ rootId: string }>;
}) => {
  await requireAdminAuth();

  const { rootId } = await params;

  prefetchCategoryById(rootId);

  return (
    <HydrateClient>
      <Suspense fallback={<CategoryIdViewLoading />}>
        <ErrorBoundary fallback={<CategoryIdViewError />}>
          <CategoryIdView rootId={rootId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default CategoryIdPage;
