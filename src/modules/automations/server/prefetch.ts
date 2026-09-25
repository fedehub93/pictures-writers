import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.automations.getMany>;

/**
 * Prefetch the automations list
 */
export const prefetchAutomations = (params: Input) => {
  return prefetch(trpc.automations.getMany.queryOptions({ ...params }));
};

/**
 * Prefetch a single automation
 */
export const prefetchAutomation = (id: string) => {
  return prefetch(trpc.automations.getOne.queryOptions({ id }));
};