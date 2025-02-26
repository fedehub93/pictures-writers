import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isWebinarMetadata } from "@/type-guards";

import { getProductMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { ProductJsonLd } from "@/app/(home)/_components/seo/json-ld/product";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import { getSettings } from "@/data/settings";
import {
  getPublishedWebinarBySlug,
  getPublishedWebinarsBuilding,
} from "@/data/webinars";

import { ProductGallery } from "@/app/(home)/_components/product/product-detail-gallery";
import { WebinarInfo } from "./_components/webinar-info";

type Params = {
  slug: string;
};

type Props = {
  params: Promise<Params>;
};

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const webinars = await getPublishedWebinarsBuilding();

  return [...webinars.map((ebook) => ({ slug: ebook.slug }))];
}

export async function generateMetadata(props: Props): Promise<Metadata | null> {
  const params = await props.params;
  const { slug } = params;

  return await getProductMetadataBySlug(slug);
}

const Page = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params;
  const { siteUrl } = await getSettings();
  const product = await getPublishedWebinarBySlug(params.slug);

  if (!product) {
    return notFound();
  }

  if (!isWebinarMetadata(product.metadata)) return;

  const galleryImages =
    product.gallery.map((image) => image.media.url || "") || [];

  return (
    <section key={product.slug} className="bg-violet-100/40 py-10">
      <ProductJsonLd
        title={product.seo?.title}
        description={product.seo?.description || ""}
        offers={{
          type: "Offer",
          priceCurrency: "EUR",
          price: product.price?.toString()!,
          url: `${siteUrl}/webinars/${product.slug}`,
          availability: "https://schema.org/InStock",
        }}
        imageCover={product.imageCover}
        images={galleryImages}
        authorName={`${product.user?.firstName} ${product.user?.lastName}`}
        datePublished={product.createdAt.toISOString()}
        dateModified={product.updatedAt.toISOString()}
        url={`${siteUrl}/webinars/${product.slug}`}
      />
      <div className="mx-auto my-5 grid w-full max-w-6xl grid-cols-1 px-4 md:grid-cols-2 gap-y-8 md:gap-y-12 gap-x-12">
        <Breadcrumbs
          items={[
            { title: "Home", href: "/" },
            { title: "Webinars", href: "/webinars/" },
            { title: product.title },
          ]}
        />
        <ProductGallery gallery={product.gallery} />
        <WebinarInfo
          rootId={product.rootId!}
          title={product.title}
          imageCoverUrl={product.imageCover?.url!}
          description={product.description}
          price={product.price}
          discountedPrice={product.discountedPrice}
          author={null}
          date={product.metadata.date}
          time={product.metadata.time}
          seats={product.metadata.seats}
          duration={product.metadata.duration}
          platform={product.metadata.platform}
        />
      </div>
    </section>
  );
};

export default Page;
