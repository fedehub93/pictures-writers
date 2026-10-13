import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";
import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { DashboardView } from "@/modules/dashboard/ui/views/dashboard-view";
import {
  prefetchDashboardFormOptions,
  prefetchDashboardLayout,
  prefetchDashboardMetrics,
} from "@/modules/dashboard/server/prefetch";

const DashboardPage = async () => {
  await requireAdminAuth();

  prefetchDashboardLayout();
  prefetchDashboardMetrics();
  prefetchDashboardFormOptions();

  return (
    <HydrateClient>
      <Suspense fallback={<>Loading</>}>
        <ErrorBoundary fallback={<>Error</>}>
          <DashboardView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default DashboardPage;
