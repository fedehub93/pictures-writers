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
 * Prefetch a single product category.
 */
export const prefetchProductCategoryById = (id: string) => {
  return prefetch(
    trpc.productCategories.getOne.queryOptions({ id }),
  );
};
