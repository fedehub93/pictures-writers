import type { SearchParams } from "nuqs";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { loadSearchParams } from "@/modules/automations/params";
import { prefetchAutomations } from "@/modules/automations/server/prefetch";

import {
  AutomationsListHeader,
  AutomationsView,
  AutomationsViewError,
  AutomationsViewLoading,
} from "@/modules/automations";

interface Props {
  searchParams: Promise<SearchParams>;
}

const AutomationsPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.AUTOMATIONS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchAutomations(filters);

  return (
    <>
      <HydrateClient>
        <AutomationsListHeader />
        <Suspense fallback={<AutomationsViewLoading />}>
          <ErrorBoundary fallback={<AutomationsViewError />}>
            <AutomationsView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default AutomationsPage;
