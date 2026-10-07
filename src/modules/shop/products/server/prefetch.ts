import { inferInput } from "@trpc/tanstack-react-query";

import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.products.getMany>;

/**
 * Prefetch the paginated product list.
 */
export const prefetchProducts = (params: Input) => {
  return prefetch(trpc.products.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch the most recent version of a product root.
 */
export const prefetchProductByRootId = (rootId: string) => {
  return prefetch(trpc.products.getLastByRootId.queryOptions({ rootId }));
};
