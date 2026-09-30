import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.credentials.getMany>;

/**
 * Prefetch the credentials list
 */
export const prefetchCredentials = (params: Input) => {
  return prefetch(
    trpc.credentials.getMany.queryOptions({
      ...params,
    }),
  );
};
