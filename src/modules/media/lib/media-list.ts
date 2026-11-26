import type { QueryKey } from "@tanstack/react-query";

/**
 * tRPC types its `infiniteQueryKey` helper only for procedures whose input has
 * a cursor. The Media list pages by number, so the entry it shares with the
 * server prefetch is composed from the plain query key: same path, same input,
 * and the `infinite` type the client's read uses.
 */
export const mediaListInfiniteKey = (queryKey: QueryKey): QueryKey => {
  const [path, meta] = queryKey;
  const input = (meta as { input?: unknown } | undefined)?.input;

  return [
    path,
    {
      ...(input !== undefined ? { input } : {}),
      type: "infinite",
    },
  ];
};

/**
 * The list's next-page rule: every client that walks `getMany` page by page
 * (the library, the Recent box's prefetch and the asset picker) stops when the
 * last block reported the end, so paging cannot repeat or skip a row.
 */
export const nextMediaPage = (
  lastPage: { totalPages: number },
  lastPageParam: number,
) => (lastPageParam < lastPage.totalPages ? lastPageParam + 1 : undefined);
