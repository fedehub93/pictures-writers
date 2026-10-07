import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  ProductCategoryIdView,
  ProductCategoryIdViewError,
  ProductCategoryIdViewLoading,
} from "@/modules/shop/product-categories";
import { prefetchProductCategoryByRootId } from "@/modules/shop/product-categories/server/prefetch";

const ProductCategoryIdPage = async ({
  params,
}: {
  params: Promise<{ rootId: string }>;
}) => {
  await requirePermission(PERMISSIONS.PRODUCT_CATEGORIES_READ);

  const { rootId } = await params;

  prefetchProductCategoryByRootId(rootId);

  return (
    <HydrateClient>
      <Suspense fallback={<ProductCategoryIdViewLoading />}>
        <ErrorBoundary fallback={<ProductCategoryIdViewError />}>
          <ProductCategoryIdView rootId={rootId} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default ProductCategoryIdPage;
