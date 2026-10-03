import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  OrdersListHeader,
  OrdersView,
  OrdersViewError,
  OrdersViewLoading,
} from "@/modules/orders";
import { loadSearchParams } from "@/modules/orders/params";
import { prefetchOrders } from "@/modules/orders/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const OrdersPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.ORDERS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchOrders(filters);

  return (
    <HydrateClient>
      <OrdersListHeader />
      <Suspense fallback={<OrdersViewLoading />}>
        <ErrorBoundary fallback={<OrdersViewError />}>
          <OrdersView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default OrdersPage;
