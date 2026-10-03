import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  OrderIdView,
  OrderIdViewError,
  OrderIdViewLoading,
} from "@/modules/orders";
import { prefetchOrderById } from "@/modules/orders/server/prefetch";

const OrderIdPage = async ({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) => {
  await requirePermission(PERMISSIONS.ORDERS_READ);

  const { orderId } = await params;

  prefetchOrderById(orderId);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<OrderIdViewError />}>
        <Suspense fallback={<OrderIdViewLoading />}>
          <OrderIdView orderId={orderId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default OrderIdPage;
