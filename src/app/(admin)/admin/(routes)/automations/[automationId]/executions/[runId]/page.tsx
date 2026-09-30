import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  RunView,
  RunViewError,
  RunViewLoading,
} from "@/modules/automations";

import { prefetchAutomationRun } from "@/modules/automations/server/prefetch";

interface PageProps {
  params: Promise<{
    automationId: string;
    runId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  await requirePermission(PERMISSIONS.AUTOMATIONS_READ);

  const { automationId, runId } = await params;
  prefetchAutomationRun(automationId, runId);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<RunViewError />}>
        <Suspense fallback={<RunViewLoading />}>
          <RunView automationId={automationId} runId={runId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default Page;
