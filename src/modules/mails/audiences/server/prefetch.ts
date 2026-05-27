import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.audiences.getMany>;

/**
 * Prefetch all Email Audiences
 */
export const prefetchAudiences = (params: Input) => {
  return prefetch(trpc.audiences.getMany.queryOptions(params));
};

/**
 * Prefetch a single audience
 */
export const prefetchAudienceById = (id: string) => {
  return prefetch(trpc.audiences.getOne.queryOptions({ id }));
};
