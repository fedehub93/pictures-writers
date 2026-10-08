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
  params: Promise<{ id: string }>;
}) => {
  await requireAdminAuth();

  const { id } = await params;

  prefetchCategoryById(id);

  return (
    <HydrateClient>
      <Suspense fallback={<CategoryIdViewLoading />}>
        <ErrorBoundary fallback={<CategoryIdViewError />}>
          <CategoryIdView id={id} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default CategoryIdPage;
