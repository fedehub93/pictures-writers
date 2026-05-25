import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.singleSends.getMany>;

/**
 * Prefetch all Email Single Sends
 */
export const prefetchSingleSends = (params: Input) => {
  return prefetch(trpc.singleSends.getMany.queryOptions(params));
};

/**
 * Prefetch a single email single send
 */
export const prefetchSingleSendById = (id: string) => {
  return prefetch(trpc.singleSends.getOne.queryOptions({ id }));
};
