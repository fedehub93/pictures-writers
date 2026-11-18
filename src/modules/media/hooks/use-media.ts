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
 * The header read: filtered count, quota and storage choice. It is non
 * suspense so the header can render while the grid streams.
 */
export const useMediaMeta = (params: MediaMetaInput) => {
  const trpc = useTRPC();

  return useQuery(trpc.media.getMeta.queryOptions({ ...params }));
};
