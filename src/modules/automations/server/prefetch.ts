import { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.automations.getMany>;
type RunsInput = inferInput<typeof trpc.automations.getRuns>;

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

/**
 * Prefetch the Runs of a single automation
 */
export const prefetchAutomationRuns = (params: RunsInput) => {
  return prefetch(trpc.automations.getRuns.queryOptions({ ...params }));
};

/**
 * Prefetch a single Run with its Step ledger
 */
export const prefetchAutomationRun = (automationId: string, id: string) => {
  return prefetch(
    trpc.automations.getRun.queryOptions({ automationId, id }),
  );
};
