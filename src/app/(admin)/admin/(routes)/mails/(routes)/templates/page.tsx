import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";
import { requireAdminAuth } from "@/shared/lib/auth-utils";

import {
  TemplatesView,
  TemplatesViewError,
  TemplatesViewLoading,
} from "@/modules/mails/templates";
import { prefetchTemplates } from "@/modules/mails/templates/server";

const TemplatesPage = async () => {
  await requireAdminAuth();

  prefetchTemplates();

  return (
    <HydrateClient>
      <Suspense fallback={<TemplatesViewLoading />}>
        <ErrorBoundary fallback={<TemplatesViewError />}>
          <TemplatesView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default TemplatesPage;
