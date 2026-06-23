import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { FormsView, FormsViewError, FormsViewLoading } from "@/modules/forms";
import { prefetchForms } from "@/modules/forms/server";

const FormsPage = async () => {
  await requireAdminAuth();

  prefetchForms();

  // const forms = await getFormsByFilters({ where: {} });

  return (
    <HydrateClient>
      <Suspense fallback={<FormsViewLoading />}>
        <ErrorBoundary fallback={<FormsViewError />}>
          <FormsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default FormsPage;
