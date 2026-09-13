import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

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
  await requirePermission(PERMISSIONS.PAGES_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchPages(filters);

  return (
    <>
      <HydrateClient>
        <PagesListHeader />
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
