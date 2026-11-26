import { inferInput } from "@trpc/tanstack-react-query";

import { caller, getQueryClient, prefetch, trpc } from "@/trpc/server";

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/modules/media/constants";
import { mediaListInfiniteKey, nextMediaPage } from "@/modules/media/lib/media-list";
import {
  recentMediaInput,
  type MediaLibraryScope,
} from "@/modules/media/hooks/use-media";

type MetaInput = inferInput<typeof trpc.media.getMeta>;

/**
 * Prefetch the library's first block into the same infinite key the client
 * reads, so the page hydrates with content instead of an empty grid. The next
 * block is asked for by "View more", not here.
 */
export const prefetchMedia = (scope: MediaLibraryScope) => {
  const input = { ...scope, pageSize: DEFAULT_PAGE_SIZE };

  return getQueryClient().prefetchInfiniteQuery({
    queryKey: mediaListInfiniteKey(trpc.media.getMany.queryKey(input)),
    queryFn: ({ pageParam }) =>
      caller.media.getMany({ ...input, page: pageParam }),
    initialPageParam: DEFAULT_PAGE,
    getNextPageParam: (
      lastPage: { totalPages: number },
      _pages: { totalPages: number }[],
      lastPageParam: number,
    ) => nextMediaPage(lastPage, lastPageParam),
  });
};

/** Prefetch the library header: filtered count, quota and storage choice. */
export const prefetchMediaMeta = (params: MetaInput) => {
  return prefetch(trpc.media.getMeta.queryOptions({ ...params }));
};

/** Prefetch the newest active Media for the Recent box preview. */
export const prefetchMediaRecent = () => {
  return prefetch(trpc.media.getMany.queryOptions(recentMediaInput));
};
