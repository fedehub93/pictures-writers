import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchPages } from "@/modules/pages/server/prefetch";

import { loadSearchParams } from "@/modules/pages/params";

import {
  PagesView,
  PagesViewError,
  PagesViewLoading,
  PagesListHeader,
} from "@/modules/pages";

interface Props {
  searchParams: Promise<SearchParams>;
}

const PagesPage = async ({ searchParams }: Props) => {
  await requireAdminAuth();

  const filters = await loadSearchParams(searchParams);

  prefetchPages(filters);

  return (
    <>
      <PagesListHeader />
      <HydrateClient>
        <Suspense fallback={<PagesViewLoading />}>
          <ErrorBoundary fallback={<PagesViewError />}>
            <PagesView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default PagesPage;
