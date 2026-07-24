import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { FormsView, FormsViewError, FormsViewLoading } from "@/modules/forms";

import { prefetchForms } from "@/modules/forms/server/prefetch";
import { loadSearchParams } from "@/modules/forms/params";

interface Props {
  searchParams: Promise<SearchParams>;
}

const FormsPage = async ({ searchParams }: Props) => {
  await requireAdminAuth();

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
