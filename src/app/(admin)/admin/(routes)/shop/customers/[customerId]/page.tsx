import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  CustomerIdView,
  CustomerIdViewError,
  CustomerIdViewLoading,
} from "@/modules/customers";
import { prefetchCustomerById } from "@/modules/customers/server/prefetch";

const CustomerIdPage = async ({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) => {
  await requirePermission(PERMISSIONS.CUSTOMERS_READ);

  const { customerId } = await params;

  prefetchCustomerById(customerId);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<CustomerIdViewError />}>
        <Suspense fallback={<CustomerIdViewLoading />}>
          <CustomerIdView customerId={customerId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default CustomerIdPage;
