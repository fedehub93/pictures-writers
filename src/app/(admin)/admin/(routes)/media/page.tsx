import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  MediaFolderDialogProvider,
  MediaListHeader,
  MediaView,
  MediaViewError,
  MediaViewLoading,
} from "@/modules/media";
import { loadMediaSearchParams } from "@/modules/media/params";
import {
  prefetchMedia,
  prefetchMediaMeta,
  prefetchMediaRecent,
} from "@/modules/media/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const MediaPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.MEDIA_READ);

  const filters = await loadMediaSearchParams(searchParams);
  // An old ?view=recent URL lands on My Drive: the main list uses the active
  // view while the Recent box still reads the recent surface.
  const listFilters =
    filters.view === "recent"
      ? { ...filters, view: "active" as const }
      : filters;

  // The first block goes into the grid's infinite key, so the suspense
  // boundary resolves with content rather than an empty grid.
  const prefetches = [
    prefetchMedia(listFilters),
    prefetchMediaMeta({
      search: filters.search,
      view: filters.view,
      folderId: filters.folderId,
    }),
  ];
  if (filters.view !== "archived") {
    prefetches.push(prefetchMediaRecent());
  }
  await Promise.all(prefetches);

  return (
    <HydrateClient>
      <MediaFolderDialogProvider>
        <MediaListHeader />
        <Suspense fallback={<MediaViewLoading />}>
          <ErrorBoundary fallback={<MediaViewError />}>
            <MediaView />
          </ErrorBoundary>
        </Suspense>
      </MediaFolderDialogProvider>
    </HydrateClient>
  );
};

export default MediaPage;
