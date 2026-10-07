import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  ProductIdView,
  ProductIdViewError,
  ProductIdViewLoading,
} from "@/modules/shop/products";
import { prefetchProductByRootId } from "@/modules/shop/products/server/prefetch";

const ProductIdPage = async ({
  params,
}: {
  params: Promise<{ rootId: string }>;
}) => {
  await requirePermission(PERMISSIONS.PRODUCTS_READ);

  const { rootId } = await params;

  prefetchProductByRootId(rootId);

  return (
    <HydrateClient>
      <Suspense fallback={<ProductIdViewLoading />}>
        <ErrorBoundary fallback={<ProductIdViewError />}>
          <ProductIdView rootId={rootId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default ProductIdPage;
