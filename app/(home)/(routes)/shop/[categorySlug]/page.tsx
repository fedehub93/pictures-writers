import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContentStatus, ProductType } from "@prisma/client";

import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import { getSettings } from "@/data/settings";
import { getPublishedProductCategoryBySlug } from "@/data/product-category";
import { getProductsPaginatedByFilters } from "@/data/product";
import { ProductsList } from "./_components/products-list";

export async function generateMetadata(
  props: PageProps<"/shop/[categorySlug]">
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

  const { products, totalPages, currentPage } =
    await getProductsPaginatedByFilters({
      where: {
        category: {
          slug: categorySlug,
          status: ContentStatus.PUBLISHED,
          isLatest: true,
        },
        status: ContentStatus.PUBLISHED,
        isLatest: true,
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
    <section className="bg-background">
      <div className="bg-accent w-full">
        <div className="max-w-6xl mx-auto h-20 flex justify-center items-center">
          <h1 className="text-primary font-extrabold text-4xl uppercase">
            {category.title}
          </h1>
        </div>
      </div>
      <div className="py-12">
        <div className="px-4 xl:px-0 lg:max-w-6xl mx-auto flex flex-col gap-y-4">
          <Breadcrumbs
            items={[
              { title: "Home", href: "/" },
              { title: "Shop", href: "/shop/" },
              { title: category.title },
            ]}
          />
          <p className="font-bold">
            Scopri la nostra collezione di ebook dedicati alla sceneggiatura
            cinematografica.
          </p>
          <p>
            Strumenti pratici, guide essenziali e approfondimenti per
            trasformare le tue idee in storie indimenticabili. Che tu sia un
            aspirante sceneggiatore o un professionista in cerca di ispirazione,
            qui troverai risorse pensate per il tuo percorso creativo.
          </p>
          <ProductsList products={products} categorySlug={categorySlug} />
        </div>
      </div>
    </section>
  );
};

export default ShopCategoryPage;
