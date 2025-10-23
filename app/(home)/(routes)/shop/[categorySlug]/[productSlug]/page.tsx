import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isEbookMetadata, isWebinarMetadata } from "@/type-guards";

import { getProductMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { ProductJsonLd } from "@/app/(home)/_components/seo/json-ld/product";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import { getSettings } from "@/data/settings";

import {
  getPublishedProductBySlug,
  getPublishedProductsBuilding,
} from "@/data/product";

import { ProductGallery } from "./_components/product-gallery";
import { EbookInfo } from "./_components/ebook-info";
import { WebinarInfo } from "./_components/webinar-info";
import { ProductType } from "@prisma/client";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getPublishedProductsBuilding();

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
  props: PageProps<"/shop/[categorySlug]/[productSlug]">
): Promise<Metadata | null> {
  const { productSlug } = await props.params;

  return await getProductMetadataBySlug(productSlug);
}

const Page = async (props: PageProps<"/shop/[categorySlug]/[productSlug]">) => {
  const { productSlug } = await props.params;

  const { siteShopUrl } = await getSettings();
  const product = await getPublishedProductBySlug(productSlug);

  if (!product || !product.category) {
    return notFound();
  }

  const galleryImages =
    product.gallery.map((image) => image.media.url || "") || [];

  const url = `${siteShopUrl}/${product.category.slug}/${product.slug}/`;

  return (
    <section key={product.slug} className="bg-background py-10">
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
      <div className="mx-auto my-5 grid w-full max-w-6xl grid-cols-1 px-4 md:grid-cols-2 gap-y-8 md:gap-y-12 gap-x-12">
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
        <ProductGallery gallery={product.gallery} />
        {isEbookMetadata(product.metadata) && (
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
        )}
        {isWebinarMetadata(product.metadata) && (
          <WebinarInfo
            id={product.id}
            rootId={product.rootId!}
            title={product.title}
            acquisitionMode={product.acquisitionMode}
            imageCoverUrl={product.imageCover?.url!}
            description={product.description}
            price={product.price}
            discountedPrice={product.discountedPrice}
            author={null}
            date={product.metadata.startDate}
            time={product.metadata.time}
            seats={product.metadata.seats}
            availableSeats={5}
            duration={product.metadata.duration}
            platform={product.metadata.platform}
          />
        )}
      </div>
    </section>
  );
};

export default Page;
