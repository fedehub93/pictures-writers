import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  CustomersListHeader,
  CustomersView,
  CustomersViewError,
  CustomersViewLoading,
} from "@/modules/customers";
import { loadSearchParams } from "@/modules/customers/params";
import { prefetchCustomers } from "@/modules/customers/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const CustomersPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.CUSTOMERS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchCustomers(filters);

  return (
    <HydrateClient>
      <CustomersListHeader />
      <Suspense fallback={<CustomersViewLoading />}>
        <ErrorBoundary fallback={<CustomersViewError />}>
          <CustomersView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default CustomersPage;
