import type { SearchParams } from "nuqs";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { loadSearchParams } from "@/modules/roles/params";
import { toRolesInput } from "@/modules/roles/filters";
import { prefetchRoles } from "@/modules/roles/server/prefetch";

import {
  RolesListHeader,
  RolesView,
  RolesViewError,
  RolesViewLoading,
} from "@/modules/roles";

interface Props {
  searchParams: Promise<SearchParams>;
}

const RolesPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.ROLES_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchRoles(toRolesInput(filters));

  return (
    <>
      <HydrateClient>
        <RolesListHeader />
        <Suspense fallback={<RolesViewLoading />}>
          <ErrorBoundary fallback={<RolesViewError />}>
            <RolesView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default RolesPage;
