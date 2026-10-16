import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";
import { requireAdminAuth } from "@/shared/lib/auth-utils";

import {
  DashboardView,
  DashboardViewError,
  DashboardViewLoading,
} from "@/modules/dashboard/ui/views/dashboard-view";
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
      <Suspense fallback={<DashboardViewLoading />}>
        <ErrorBoundary fallback={<DashboardViewError />}>
          <DashboardView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default DashboardPage;
