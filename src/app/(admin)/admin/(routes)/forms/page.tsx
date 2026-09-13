import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { FormsView, FormsViewError, FormsViewLoading } from "@/modules/forms";

import { prefetchForms } from "@/modules/forms/server/prefetch";
import { loadSearchParams } from "@/modules/forms/params";

interface Props {
  searchParams: Promise<SearchParams>;
}

const FormsPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.FORMS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchForms(filters);

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
