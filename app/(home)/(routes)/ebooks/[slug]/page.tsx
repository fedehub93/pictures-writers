import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isEbookMetadata } from "@/type-guards";

import { getProductMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { ProductJsonLd } from "@/app/(home)/_components/seo/json-ld/product";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import { getSettings } from "@/data/settings";
import {
  getPublishedEbookBySlug,
  getPublishedEbooksBuilding,
} from "@/data/ebook";

import { EbookImage } from "./_components/ebook-image";
import { EbookInfo } from "./_components/ebook-info";

type Params = {
  slug: string;
};

type Props = {
  params: Params;
};

export const revalidate = 3600 * 24;

export const dynamicParams = true;

export async function generateStaticParams() {
  const ebooks = await getPublishedEbooksBuilding();

  return [...ebooks.map((ebook) => ({ slug: ebook.slug }))];
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata | null> {
  const { slug } = params;

  return await getProductMetadataBySlug(slug);
}

const Page = async ({ params }: { params: { slug: string } }) => {
  const { siteUrl } = await getSettings();
  const product = await getPublishedEbookBySlug(params.slug);

  if (!product) {
    return notFound();
  }

  if (!isEbookMetadata(product.metadata)) return;

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
          url: `${siteUrl}/ebooks/${product.slug}`,
          availability: "https://schema.org/InStock",
        }}
        imageCover={product.imageCover}
        images={galleryImages}
        authorName={`${product.user?.firstName} ${product.user?.lastName}`}
        datePublished={product.createdAt.toISOString()}
        dateModified={product.updatedAt.toISOString()}
        url={`${siteUrl}/ebooks/${product.slug}`}
      />
      <div className="mx-auto my-5 grid w-full max-w-6xl grid-cols-1 px-4 md:grid-cols-2 gap-y-8 md:gap-y-12 gap-x-12">
        <Breadcrumbs
          items={[
            { title: "Home", href: "/" },
            { title: "Ebooks", href: "/ebooks/" },
            { title: product.title },
          ]}
        />
        <EbookImage gallery={product.gallery} />
        <EbookInfo
          rootId={product.rootId!}
          title={product.title}
          imageCoverUrl={product.imageCover?.url!}
          description={product.description}
          price={product.price}
          discountedPrice={product.discountedPrice}
          formats={product.metadata.formats}
          publishedAt={product.metadata.publishedAt}
          author={product.metadata.author}
          edition={product.metadata.edition}
        />
      </div>
    </section>
  );
};

export default Page;
