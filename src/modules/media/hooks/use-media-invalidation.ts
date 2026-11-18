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

  const invalidateLibrary = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.media.getMany.queryKey(),
      }),
      invalidateMeta(),
    ]);

  return { invalidateLibrary, invalidateMeta };
};
