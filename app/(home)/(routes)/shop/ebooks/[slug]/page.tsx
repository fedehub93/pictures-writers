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

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const ebooks = await getPublishedEbooksBuilding();

  return [...ebooks.map((ebook) => ({ slug: ebook.slug }))];
}

export async function generateMetadata(
  props: PageProps<"/shop/ebooks/[slug]">
): Promise<Metadata | null> {
  const { slug } = await props.params;

  return await getProductMetadataBySlug(slug);
}

const Page = async (props: PageProps<"/shop/ebooks/[slug]">) => {
  const { slug } = await props.params;
  const { siteShopUrl } = await getSettings();
  const product = await getPublishedEbookBySlug(slug);

  if (!product || !product.category) {
    return notFound();
  }

  if (!isEbookMetadata(product.metadata)) return;

  const galleryImages =
    product.gallery.map((image) => image.media.url || "") || [];

  const ebookUrl = `${siteShopUrl}/${product.category.slug}/${product.slug}/`;

  return (
    <section key={product.slug} className="bg-background py-10">
      <ProductJsonLd
        title={product.seo?.title}
        description={product.seo?.description || ""}
        offers={{
          type: "Offer",
          priceCurrency: "EUR",
          price: product.price?.toString()!,
          url: ebookUrl,
          availability: "https://schema.org/InStock",
        }}
        images={galleryImages}
        authorName={`${product.user?.firstName} ${product.user?.lastName}`}
        datePublished={product.createdAt.toISOString()}
        dateModified={product.updatedAt.toISOString()}
        url={ebookUrl}
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
