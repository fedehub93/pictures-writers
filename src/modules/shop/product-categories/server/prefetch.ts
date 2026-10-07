import { inferInput } from "@trpc/tanstack-react-query";

import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.productCategories.getMany>;

/**
 * Prefetch the paginated product category list.
 */
export const prefetchProductCategories = (params: Input) => {
  return prefetch(
    trpc.productCategories.getMany.queryOptions({ ...params }),
  );
};

/**
 * Prefetch the most recent version of a product category root.
 */
export const prefetchProductCategoryByRootId = (rootId: string) => {
  return prefetch(
    trpc.productCategories.getLastByRootId.queryOptions({ rootId }),
  );
};
