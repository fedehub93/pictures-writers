import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.submissions.getMany>;

/**
 * Prefetch all submissions
 */
export const prefetchFormSubmissions = (params: Input) => {
  return prefetch(trpc.submissions.getMany.queryOptions(params));
};

/**
 * Prefetch a single submission
 */
export const prefetchFormSubmissionById = (id: string) => {
  return prefetch(trpc.submissions.getOne.queryOptions({ id }));
};
