import type { SearchParams } from "nuqs";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { loadSearchParams } from "@/modules/users/params";
import { toUsersInput } from "@/modules/users/filters";
import { prefetchUsers } from "@/modules/users/server/prefetch";

import {
  UsersListHeader,
  UsersView,
  UsersViewError,
  UsersViewLoading,
} from "@/modules/users";

interface Props {
  searchParams: Promise<SearchParams>;
}

const UsersPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.USERS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchUsers(toUsersInput(filters));

  return (
    <>
      <HydrateClient>
        <UsersListHeader />
        <Suspense fallback={<UsersViewLoading />}>
          <ErrorBoundary fallback={<UsersViewError />}>
            <UsersView />
          </ErrorBoundary>
        </Suspense>
      </HydrateClient>
    </>
  );
};

export default UsersPage;
