import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";

type MediaListInput = inferInput<typeof trpc.media.getMany>;
type MediaMetaInput = inferInput<typeof trpc.media.getMeta>;

/** Suspense read of the visible page of the media library. */
export const useSuspenseMedia = (params: MediaListInput) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.media.getMany.queryOptions({ ...params }));
};

/**
 * The header read: filtered count, quota, storage choice and how many files
 * still sit on another driver. It is non suspense so the header can render
 * while the grid streams.
 */
export const useMediaMeta = (params: MediaMetaInput) => {
  const trpc = useTRPC();

  return useQuery(trpc.media.getMeta.queryOptions({ ...params }));
};

/**
 * The space the next move needs. It is only asked when the header says a
 * move is possible; the server refuses an impossible run with the same plan.
 */
export const useMediaRehomePlan = (enabled: boolean) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.media.rehomePlan.queryOptions(),
    enabled,
  });
};

/** The current or last move. Polling follows the run, not a fixed clock. */
export const useMediaRehomeStatus = () => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.media.rehomeStatus.queryOptions(),
    refetchInterval: (query) =>
      query.state.data?.status === "running" ||
      query.state.data?.status === "stopping"
        ? 1000
        : false,
  });
};
