import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";
import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { DashboardView } from "@/modules/dashboard/ui/views/dashboard-view";

const DashboardPage = async () => {
  await requireAdminAuth();

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
