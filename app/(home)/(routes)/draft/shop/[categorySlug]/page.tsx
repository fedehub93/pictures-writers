import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContentStatus, ProductType } from "@prisma/client";

import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import { getSettings } from "@/data/settings";
import {
  getDraftProductCategoryBySlug,
  getPublishedProductCategoryBySlug,
} from "@/data/product-category";
import { getProductsPaginatedByFilters } from "@/data/product";
import { ProductsList } from "../../../shop/[categorySlug]/_components/products-list";

export const dynamic = "force-dynamic";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateMetadata(
  props: PageProps<"/draft/shop/[categorySlug]">
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
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

const ShopCategoryPage = async (
  props: PageProps<"/draft/shop/[categorySlug]">
) => {
  const { categorySlug } = await props.params;

  const category = await getPublishedProductCategoryBySlug({
    slug: categorySlug,
  });

  const { products, totalPages, currentPage } =
    await getProductsPaginatedByFilters({
      where: {
        category: {
          slug: categorySlug,
          status: ContentStatus.PUBLISHED,
        },
        OR: [
          {
            status: ContentStatus.DRAFT,
            isLatest: true,
          },
          {
            status: ContentStatus.CHANGED,
            isLatest: false,
          },
        ],
        type: {
          not: ProductType.AFFILIATE,
        },
      },
      page: 1,
    });

  if (!category || !products.length) {
    return redirect(`/draft/shop/ebooks`);
  }

  return (
    <section className="bg-background">
      <div className="bg-accent w-full">
        <div className="max-w-6xl mx-auto h-20 flex justify-center items-center">
          <h1 className="text-primary font-extrabold text-4xl uppercase">
            {category.title}
          </h1>
        </div>
      </div>
      <div className="py-6">
        <div className="px-4 xl:px-0 lg:max-w-6xl mx-auto flex flex-col gap-y-4">
          <Breadcrumbs
            items={[
              { title: "Home", href: "/" },
              { title: "Shop", href: "/draft/shop/" },
              { title: category.title },
            ]}
          />
          <p>{category.description}</p>
          <ProductsList products={products} categorySlug={categorySlug} />
        </div>
      </div>
    </section>
  );
};

export default ShopCategoryPage;
