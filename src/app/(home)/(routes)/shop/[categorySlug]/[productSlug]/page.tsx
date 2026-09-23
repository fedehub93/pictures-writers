import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  isEbookMetadata,
  isServiceMetadata,
  isWebinarMetadata,
} from "@/type-guards";

import { getProductMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { ProductJsonLd } from "@/app/(home)/_components/seo/json-ld/product";
import { BreadcrumbListJsonLd } from "@/app/(home)/_components/seo/json-ld/breadcrumb-list";
import { FaqPageJsonLd } from "@/app/(home)/_components/seo/json-ld/faq-page";
import { EventJsonLd } from "@/app/(home)/_components/seo/json-ld/event";
import { CourseJsonLd } from "@/app/(home)/_components/seo/json-ld/course";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import { getSettings } from "@/data/settings";

import {
  getPublishedProductBySlug,
  getPublishedProductsBuilding,
} from "@/data/product";

import { ProductGallery } from "./_components/product-gallery";
import { EbookInfo } from "./_components/ebook-info";

import { TipTapRendererV2 } from "@/shared/components/tiptap-renderer";

import { Webinar } from "./_components/webinar";
import { Service } from "./_components/service";

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
  props: PageProps<"/shop/[categorySlug]/[productSlug]">,
): Promise<Metadata | null> {
  const { productSlug } = await props.params;

  return await getProductMetadataBySlug(productSlug);
}

const Page = async (props: PageProps<"/shop/[categorySlug]/[productSlug]">) => {
  const { productSlug } = await props.params;

  const { siteUrl, siteShopUrl, siteName } = await getSettings();
  const product = await getPublishedProductBySlug(productSlug);

  if (!product || !product.category) {
    return notFound();
  }

  const galleryImages =
    product.gallery.map((image) => image.media.url || "") || [];

  const url = `${siteShopUrl}/${product.category.slug}/${product.slug}/`;

  const webinarData = isWebinarMetadata(product.metadata)
    ? product.metadata
    : null;

  const offer = {
    priceCurrency: "EUR",
    price: product.price?.toString() ?? "0",
    url,
    availability: "https://schema.org/InStock" as const,
  };

  return (
    <section key={product.slug} className="bg-background py-8">
      {webinarData && webinarData.lessons.length > 0 ? (
        <CourseJsonLd
          name={product.title}
          description={product.seo?.description || ""}
          url={url}
          image={product.imageCover?.url || undefined}
          providerName={siteName || "Pictures Writers"}
          providerUrl={`${siteUrl}/`}
          courseMode="online"
          offers={offer}
          lessons={webinarData.lessons}
        />
      ) : (
        <ProductJsonLd
          title={product.seo?.title}
          description={product.seo?.description || ""}
          offers={{
            type: "Offer",
            priceCurrency: "EUR",
            price: product.price?.toString() ?? "",
            url: url,
            availability: "https://schema.org/InStock",
          }}
          images={galleryImages}
          aggregateRating={product.aggregateRating}
          reviews={product.reviews}
          authorName={`${product.user?.firstName} ${product.user?.lastName}`}
          datePublished={product.createdAt.toISOString()}
          dateModified={product.updatedAt.toISOString()}
          url={url}
        />
      )}
      {webinarData && webinarData.lessons.length > 0 && (
        <EventJsonLd
          name={product.title}
          description={product.seo?.description || ""}
          url={url}
          image={product.imageCover?.url || undefined}
          organizerName={siteName || "Pictures Writers"}
          siteUrl={`${siteUrl}/`}
          seats={webinarData.seats}
          lessons={webinarData.lessons}
          offers={offer}
        />
      )}
      <BreadcrumbListJsonLd
        items={[
          { title: "Home", href: `${siteUrl}/` },
          { title: "Shop", href: `${siteShopUrl}/` },
          {
            title: product.category.slug,
            href: `${siteShopUrl}/${product.category.slug}/`,
          },
          { title: product.title, href: url },
        ]}
      />
      <FaqPageJsonLd mainEntity={product.faqs} />
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
              imageCoverUrl={product.imageCover?.url ?? ""}
              price={product.price}
              discountedPrice={product.discountedPrice}
              formats={product.metadata.formats}
              publishedAt={product.metadata.publishedAt}
              author={product.metadata.author}
              edition={product.metadata.edition}
            >
              {product.tiptapDescription && (
                <TipTapRendererV2 content={product.tiptapDescription} />
              )}
            </EbookInfo>
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
            reviews={product.reviews}
            faqs={product.faqs}
          />
        )}
        {isServiceMetadata(product.metadata) && (
          <Service
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
