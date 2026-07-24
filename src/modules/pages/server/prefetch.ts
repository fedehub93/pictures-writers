import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.pages.getMany>;

/**
 * Prefetch all Pages
 */
export const prefetchPages = (params: Input) => {
  return prefetch(trpc.pages.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch a single page
 */
export const prefetchPageById = (rootId: string) => {
  return prefetch(trpc.pages.getLastByRootId.queryOptions({ rootId }));
};
