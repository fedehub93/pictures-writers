import { inferInput } from "@trpc/tanstack-react-query";

import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.reviews.getMany>;

/**
 * Prefetch the paginated review list.
 */
export const prefetchReviews = (params: Input) => {
  return prefetch(trpc.reviews.getMany.queryOptions({ ...params }));
};
