import type { SearchParams } from "nuqs";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { loadSearchParams } from "@/modules/blog/categories/params";
import { prefetchCategories } from "@/modules/blog/categories/server/prefetch";
import {
  CategoriesListHeader,
  CategoriesView,
  CategoriesViewError,
  CategoriesViewLoading,
} from "@/modules/blog/categories";

interface Props {
  searchParams: Promise<SearchParams>;
}

const CategoriesPage = async ({ searchParams }: Props) => {
  await requireAdminAuth();

  const filters = await loadSearchParams(searchParams);

  prefetchCategories(filters);

  return (
    <>
      <CategoriesListHeader />
      <HydrateClient>
        <Suspense fallback={<CategoriesViewLoading />}>
          <ErrorBoundary fallback={<CategoriesViewError />}>
            <CategoriesView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default CategoriesPage;
