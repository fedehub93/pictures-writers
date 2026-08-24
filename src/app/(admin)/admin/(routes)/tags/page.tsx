import type { SearchParams } from "nuqs";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { loadSearchParams } from "@/modules/blog/tags/params";
import { prefetchTags } from "@/modules/blog/tags/server/prefetch";
import {
  TagsListHeader,
  TagsView,
  TagsViewError,
  TagsViewLoading,
} from "@/modules/blog/tags";

interface Props {
  searchParams: Promise<SearchParams>;
}

const TagsPage = async ({ searchParams }: Props) => {
  await requireAdminAuth();

  const filters = await loadSearchParams(searchParams);

  prefetchTags(filters);

  return (
    <>
      <TagsListHeader />
      <HydrateClient>
        <Suspense fallback={<TagsViewLoading />}>
          <ErrorBoundary fallback={<TagsViewError />}>
            <TagsView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default TagsPage;
