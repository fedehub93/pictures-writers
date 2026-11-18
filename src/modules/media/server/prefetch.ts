import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type ListInput = inferInput<typeof trpc.media.getMany>;
type MetaInput = inferInput<typeof trpc.media.getMeta>;

/** Prefetch the visible page of the media library. */
export const prefetchMedia = (params: ListInput) => {
  return prefetch(trpc.media.getMany.queryOptions({ ...params }));
};

/** Prefetch the library header: filtered count, quota and storage choice. */
export const prefetchMediaMeta = (params: MetaInput) => {
  return prefetch(trpc.media.getMeta.queryOptions({ ...params }));
};
