import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  CredentialsListHeader,
  CredentialsView,
  CredentialsViewError,
  CredentialsViewLoading,
} from "@/modules/automations";

import { loadSearchParams } from "@/modules/automations/credentials/params";
import { prefetchCredentials } from "@/modules/automations/credentials/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.AUTOMATIONS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchCredentials(filters);

  return (
    <HydrateClient>
      <CredentialsListHeader />
      <Suspense fallback={<CredentialsViewLoading />}>
        <ErrorBoundary fallback={<CredentialsViewError />}>
          <CredentialsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default Page;
