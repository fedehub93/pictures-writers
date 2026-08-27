import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.tags.getMany>;

/**
 * Prefetch all Tags
 */
export const prefetchTags = (params: Input) => {
  return prefetch(trpc.tags.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch a single Tag
 */
export const prefetchTagById = (rootId: string) => {
  return prefetch(trpc.tags.getLastByRootId.queryOptions({ rootId }));
};
