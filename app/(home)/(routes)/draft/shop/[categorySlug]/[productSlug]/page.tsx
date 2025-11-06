import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isEbookMetadata, isWebinarMetadata } from "@/type-guards";

import { getProductMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { ProductJsonLd } from "@/app/(home)/_components/seo/json-ld/product";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import { getSettings } from "@/data/settings";

import {
  getDraftProductBySlug,
  getDraftProductsBuilding,
} from "@/data/product";

import { ProductGallery } from "@/app/(home)/(routes)/shop/[categorySlug]/[productSlug]/_components/product-gallery";
import { EbookInfo } from "@/app/(home)/(routes)/shop/[categorySlug]/[productSlug]/_components/ebook-info";
import { Webinar } from "@/app/(home)/(routes)/shop/[categorySlug]/[productSlug]/_components/webinar";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getDraftProductsBuilding();

  return [
    ...products
      .filter((p) => p.category)
      .map((p) => ({
        categorySlug: p.category?.slug,
        productSlug: p.slug,
      })),
  ];
}

export async function generateMetadata(
  props: PageProps<"/draft/shop/[categorySlug]/[productSlug]">
): Promise<Metadata | null> {
  const { productSlug } = await props.params;

  return {
    ...(await getProductMetadataBySlug(productSlug)),
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

const Page = async (
  props: PageProps<"/draft/shop/[categorySlug]/[productSlug]">
) => {
  const { productSlug } = await props.params;

  const { siteShopUrl } = await getSettings();
  const product = await getDraftProductBySlug(productSlug);
  console.log(productSlug);

  if (!product || !product.category) {
    return notFound();
  }

  const galleryImages =
    product.gallery.map((image) => image.media.url || "") || [];

  const url = `${siteShopUrl}/${product.category.slug}/${product.slug}/`;

  return (
    <section key={product.slug} className="bg-background py-8">
      <ProductJsonLd
        title={product.seo?.title}
        description={product.seo?.description || ""}
        offers={{
          type: "Offer",
          priceCurrency: "EUR",
          price: product.price?.toString()!,
          url: url,
          availability: "https://schema.org/InStock",
        }}
        images={galleryImages}
        authorName={`${product.user?.firstName} ${product.user?.lastName}`}
        datePublished={product.createdAt.toISOString()}
        dateModified={product.updatedAt.toISOString()}
        url={url}
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 px-4 md:grid-cols-2 space-y-6 gap-x-12">
        <Breadcrumbs
          items={[
            { title: "Home", href: "/" },
            { title: "Shop", href: `/shop/` },
            {
              title: product.category.title,
              href: `/shop/${product.category.slug}/`,
            },
            { title: product.title },
          ]}
        />
        {isEbookMetadata(product.metadata) && (
          <>
            <ProductGallery gallery={product.gallery} />
            <EbookInfo
              rootId={product.rootId!}
              title={product.title}
              acquisitionMode={product.acquisitionMode}
              imageCoverUrl={product.imageCover?.url!}
              description={product.description}
              price={product.price}
              discountedPrice={product.discountedPrice}
              formats={product.metadata.formats}
              publishedAt={product.metadata.publishedAt}
              author={product.metadata.author}
              edition={product.metadata.edition}
            />
          </>
        )}
        {isWebinarMetadata(product.metadata) && (
          <Webinar
            id={product.id}
            title={product.title}
            tiptapDescription={product.tiptapDescription}
            image={product.imageCover}
            price={product.price}
            discountedPrice={product.discountedPrice}
            acquisitionMode={product.acquisitionMode}
            data={product.metadata}
            faqs={product.faqs}
          />
        )}
      </div>
    </section>
  );
};

export default Page;
