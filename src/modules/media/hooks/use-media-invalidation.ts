import { useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Every write that changes the library refreshes both reads: the grid and the
 * header (count, quota, driver). No action calls a full route refresh.
 */
export const useMediaInvalidation = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidateMeta = () =>
    queryClient.invalidateQueries({ queryKey: trpc.media.getMeta.queryKey() });

  /**
   * The move's own reads. A driver switch changes what a move would do, so
   * the preflight and the progress must be asked again rather than shown
   * with the previous target.
   */
  const invalidateRehome = () =>
    Promise.all([
      queryClient.invalidateQueries(trpc.media.rehomePlan.pathFilter()),
      queryClient.invalidateQueries(trpc.media.rehomeStatus.pathFilter()),
    ]);

  const invalidateLibrary = () =>
    Promise.all([
      // The path filter, not the query key: the library reads pages and the
      // picker reads an infinite list, and one write must refresh both.
      queryClient.invalidateQueries(trpc.media.getMany.pathFilter()),
      invalidateMeta(),
    ]);

  return { invalidateLibrary, invalidateMeta, invalidateRehome };
};
