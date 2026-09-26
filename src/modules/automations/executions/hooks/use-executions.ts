import { useSuspenseQuery } from "@tanstack/react-query";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import { AutomationRunStatus } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";

import { AUTOMATION_RUN_STATUSES, DEFAULT_PAGE } from "../../constants";

export const useExecutionsFilters = () => {
  return useQueryStates({
    status: parseAsStringEnum([...AUTOMATION_RUN_STATUSES]),
    from: parseAsString,
    to: parseAsString,
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
  });
};

type RunsFilters = {
  page: number;
  status: AutomationRunStatus | null;
  from: string | null;
  to: string | null;
};

export const useSuspenseAutomationRuns = (
  automationId: string,
  filters: RunsFilters,
) => {
  const trpc = useTRPC();

  return useSuspenseQuery(
    trpc.automations.getRuns.queryOptions({
      automationId,
      page: filters.page,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    }),
  );
};

export const useSuspenseAutomationRun = (automationId: string, id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery(
    trpc.automations.getRun.queryOptions({ automationId, id }),
  );
};
