import { useInfiniteQuery } from "@tanstack/react-query";

import { useTRPC, useTRPCClient } from "@/trpc/client";

import { DEFAULT_PAGE, MEDIA_PICKER_PAGE_SIZE } from "../constants";

interface UseMediaInfiniteQueryProps {
  search: string;
  enabled: boolean;
}

/**
 * The Media picker's read: the library's own list procedure, twelve rows per
 * load and the same case-insensitive name search. It reads the Recent view
 * because the picker offers the whole library, not one folder: Recent is the
 * flat, newest-first read that ignores folder membership. The page is the
 * infinite query's page param, so "load more" continues after the rows already
 * on screen instead of asking for a fresh first page.
 *
 * The key lives in the `getMany` namespace, so the invalidation the library's
 * writes already perform refreshes the picker too.
 */
export const useMediaInfiniteQuery = ({
  search,
  enabled,
}: UseMediaInfiniteQueryProps) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const input = {
    pageSize: MEDIA_PICKER_PAGE_SIZE,
    search,
    view: "recent" as const,
  };

  return useInfiniteQuery({
    // `getMany` has no cursor, so tRPC exposes no infinite key helper for it:
    // the list's query key is the only typed key. Invalidation targets the
    // router path (`getMany.pathFilter()`), so this type cannot desync it.
    queryKey: trpc.media.getMany.queryKey(input),
    queryFn: ({ pageParam, signal }) =>
      trpcClient.media.getMany.query({ ...input, page: pageParam }, { signal }),
    initialPageParam: DEFAULT_PAGE,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPageParam < lastPage.totalPages ? lastPageParam + 1 : undefined,
    enabled,
    refetchOnWindowFocus: false,
  });
};
