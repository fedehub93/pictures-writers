import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { prefetchFormSubmissions } from "@/modules/forms/submissions/server";
import {
  FormSubmissionsView,
  FormSubmissionsViewError,
  FormSubmissionsViewLoading,
} from "@/modules/forms/submissions/ui/views/submissions-view";
import { loadSearchParams } from "@/modules/forms/submissions/params";
import { SubmissionsListHeader } from "@/modules/forms/submissions/ui/components/submissions-list-header";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Submissions = async ({ searchParams }: Props) => {
  await requireAdminAuth();

  const filters = await loadSearchParams(searchParams);

  prefetchFormSubmissions(filters);

  return (
    <>
      <SubmissionsListHeader />
      <HydrateClient>
        <Suspense fallback={<FormSubmissionsViewLoading />}>
          <ErrorBoundary fallback={<FormSubmissionsViewError />}>
            <FormSubmissionsView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default Submissions;
