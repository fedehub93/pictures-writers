import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  MediaListHeader,
  MediaView,
  MediaViewError,
  MediaViewLoading,
} from "@/modules/media";
import { loadMediaSearchParams } from "@/modules/media/params";
import {
  prefetchMedia,
  prefetchMediaMeta,
} from "@/modules/media/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const MediaPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.MEDIA_READ);

  const filters = await loadMediaSearchParams(searchParams);

  prefetchMedia(filters);
  await prefetchMediaMeta({
    search: filters.search,
    view: filters.view,
  });

  return (
    <HydrateClient>
      <MediaListHeader />
      <Suspense fallback={<MediaViewLoading />}>
        <ErrorBoundary fallback={<MediaViewError />}>
          <MediaView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default MediaPage;
