import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs";

import { HydrateClient } from "@/trpc/server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  ProductCategoriesListHeader,
  ProductCategoriesView,
  ProductCategoriesViewError,
  ProductCategoriesViewLoading,
} from "@/modules/shop/product-categories";
import { loadSearchParams } from "@/modules/shop/product-categories/params";
import { prefetchProductCategories } from "@/modules/shop/product-categories/server/prefetch";

interface Props {
  searchParams: Promise<SearchParams>;
}

const ProductCategoriesPage = async ({ searchParams }: Props) => {
  await requirePermission(PERMISSIONS.PRODUCT_CATEGORIES_READ);

  const filters = await loadSearchParams(searchParams);

  prefetchProductCategories(filters);

  return (
    <HydrateClient>
      <ProductCategoriesListHeader />
      <Suspense fallback={<ProductCategoriesViewLoading />}>
        <ErrorBoundary fallback={<ProductCategoriesViewError />}>
          <ProductCategoriesView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default ProductCategoriesPage;
