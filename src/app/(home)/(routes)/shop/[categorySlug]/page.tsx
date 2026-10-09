import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContentStatus, ProductType } from "@/generated/prisma";

import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

import { getSettings } from "@/data/settings";
import { getPublishedProductCategoryBySlug } from "@/modules/shop/product-categories/server/queries";
import {
  CategoryView,
  getProductsPaginatedByFilters,
} from "@/modules/shop/products";

export async function generateMetadata(
  props: PageProps<"/shop/[categorySlug]">,
): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();
  const { categorySlug } = await props.params;
  const category = await getPublishedProductCategoryBySlug({
    slug: categorySlug,
  });

  const { siteShopUrl } = await getSettings();

  return {
    ...metadata,
    title: category?.seo?.title,
    description: category?.seo?.description,
    alternates: {
      canonical: `${siteShopUrl}/${categorySlug}/`,
    },
  };
}

const ShopCategoryPage = async (props: PageProps<"/shop/[categorySlug]">) => {
  const { categorySlug } = await props.params;

  const category = await getPublishedProductCategoryBySlug({
    slug: categorySlug,
  });

  const { products } = await getProductsPaginatedByFilters({
    where: {
      category: {
        slug: categorySlug,
      },
      status: ContentStatus.PUBLISHED,
    },
    rootWhere: {
      type: {
        not: ProductType.AFFILIATE,
      },
    },
    page: 1,
  });

  if (!category || !products.length) {
    return redirect(`/shop/ebooks`);
  }

  return (
    <CategoryView
      category={category}
      categorySlug={categorySlug}
      products={products}
    />
  );
};

export default ShopCategoryPage;
