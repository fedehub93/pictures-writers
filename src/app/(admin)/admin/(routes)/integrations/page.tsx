import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import {
  IntegrationsView,
  IntegrationsViewError,
  IntegrationsViewLoading,
} from "@/modules/integrations/ui/views/integrations-view";
import { prefetchIntegrations } from "@/modules/integrations/server/prefetch";

const IntegrationsPage = async () => {
  prefetchIntegrations();

  return (
    <HydrateClient>
      <Suspense fallback={<IntegrationsViewLoading />}>
        <ErrorBoundary fallback={<IntegrationsViewError />}>
          <IntegrationsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default IntegrationsPage;
