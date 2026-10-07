import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  ProductsListHeader,
  ProductsView,
  ProductsViewError,
  ProductsViewLoading,
} from "@/modules/shop/products";
import { loadSearchParams } from "@/modules/shop/products/params";
import { prefetchProducts } from "@/modules/shop/products/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const ProductsPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.PRODUCTS_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchProducts(filters);

  return (
    <HydrateClient>
      <ProductsListHeader />
      <Suspense fallback={<ProductsViewLoading />}>
        <ErrorBoundary fallback={<ProductsViewError />}>
          <ProductsView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default ProductsPage;
