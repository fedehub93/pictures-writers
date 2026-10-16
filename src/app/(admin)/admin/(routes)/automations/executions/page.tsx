import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  ExecutionsListHeader,
  ExecutionsView,
  ExecutionsViewError,
  ExecutionsViewLoading,
} from "@/modules/automations";

import { loadRunSearchParams } from "@/modules/automations/executions/params";
import { prefetchAllAutomationRuns } from "@/modules/automations/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const ExecutionsPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.AUTOMATIONS_READ);

  const filters = await loadRunSearchParams(searchParams);

  prefetchAllAutomationRuns(filters);

  return (
    <HydrateClient>
      <ExecutionsListHeader />
      <Suspense fallback={<ExecutionsViewLoading />}>
        <ErrorBoundary fallback={<ExecutionsViewError />}>
          <ExecutionsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default ExecutionsPage;
