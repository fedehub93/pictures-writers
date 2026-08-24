import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.categories.getMany>;

/**
 * Prefetch all Categories
 */
export const prefetchCategories = (params: Input) => {
  return prefetch(trpc.categories.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch a single category
 */
export const prefetchCategoryById = (rootId: string) => {
  return prefetch(trpc.categories.getLastByRootId.queryOptions({ rootId }));
};
