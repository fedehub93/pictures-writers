import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.forms.getMany>;

/**
 * Prefetch all Email Audiences
 */
export const prefetchForms = (params: Input) => {
  return prefetch(trpc.forms.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch a single audience
 */
export const prefetchFormById = (id: string) => {
  return prefetch(trpc.forms.getOne.queryOptions({ id }));
};
