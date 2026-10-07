import { getSettings } from "@/data/settings";

import { BreadcrumbListJsonLd } from "@/app/(home)/_components/seo/json-ld/breadcrumb-list";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import type { GetPublishedProductCategoryBySlugReturn } from "@/modules/shop/product-categories/server/queries";

import type { GetProductsPaginatedByFiltersReturn } from "../../server/queries";
import { CategoryHero } from "./category-hero";
import { ProductsList } from "./products-list";

interface CategoryViewProps {
  category: NonNullable<GetPublishedProductCategoryBySlugReturn>;
  categorySlug: string;
  products: GetProductsPaginatedByFiltersReturn["products"];
}

export const CategoryView = async ({
  category,
  categorySlug,
  products,
}: CategoryViewProps) => {
  const { siteUrl, siteShopUrl } = await getSettings();

  return (
    <div className="bg-background">
      <BreadcrumbListJsonLd
        items={[
          { title: "Home", href: `${siteUrl}/` },
          { title: "Shop", href: `${siteShopUrl}/` },
          {
            title: category.title,
            href: `${siteShopUrl}/${category.slug}/`,
          },
        ]}
      />
      <div className="py-8 mx-auto grid w-full max-w-6xl grid-cols-1 px-4 md:grid-cols-2 space-y-6 gap-x-12">
        <Breadcrumbs
          items={[
            { title: "Home", href: "/" },
            { title: "Shop", href: `/shop/` },
            {
              title: category.title,
              href: `/shop/${category.slug}/`,
            },
          ]}
        />
      </div>
      <CategoryHero categorySlug={categorySlug} />
      <section className="bg-white">
        <div className="py-6 px-4 xl:px-0 lg:max-w-6xl mx-auto flex flex-col gap-y-4">
          <ProductsList products={products} categorySlug={categorySlug} />
        </div>
      </section>
    </div>
  );
};
