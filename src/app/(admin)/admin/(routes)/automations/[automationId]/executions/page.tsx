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
import { prefetchAutomationRuns } from "@/modules/automations/server/prefetch";

interface PageProps {
  params: Promise<{
    automationId: string;
  }>;
  searchParams: Promise<SearchParams>;
}

const Page = async ({ params, searchParams }: PageProps) => {
  await requirePermission(PERMISSIONS.AUTOMATIONS_READ);

  const { automationId } = await params;
  const filters = await loadRunSearchParams(searchParams);

  prefetchAutomationRuns({ automationId, ...filters });

  return (
    <HydrateClient>
      <ExecutionsListHeader automationId={automationId} />
      <Suspense fallback={<ExecutionsViewLoading />}>
        <ErrorBoundary fallback={<ExecutionsViewError />}>
          <ExecutionsView automationId={automationId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default Page;
