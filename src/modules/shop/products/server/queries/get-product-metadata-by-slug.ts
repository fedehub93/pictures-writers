import { Metadata } from "next";

import { ContentStatus } from "@/generated/prisma";

import { getSettings } from "@/data/settings";

import { db } from "@/shared/lib/db";

export async function getProductMetadataBySlug(
  slug: string,
): Promise<Metadata | null> {
  const { siteName, siteShopUrl } = await getSettings();

  const product = await db.product.findFirst({
    where: {
      slug,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
      seo: true,
      category: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!product || !product.seo) {
    return null;
  }

  return {
    title: product.seo.title,
    description: product.seo.description,
    robots: {
      index: !product.seo.noIndex,
      follow: !product.seo.noFollow,
      googleBot: {
        index: !product.seo.noIndex,
        follow: !product.seo.noFollow,
      },
    },
    alternates: {
      canonical: product.seo.canonicalUrl
        ? product.seo.canonicalUrl
        : `${siteShopUrl}/${product.category?.slug}/${product.slug}/`,
    },
    openGraph: {
      title: product.seo.ogTwitterTitle || product.seo.title,
      description:
        product.seo.ogTwitterDescription || product.seo.description || "",
      url: product.seo.ogTwitterUrl || "",
      siteName: siteName!,
      images: product.imageCover
        ? [
            {
              url: product.imageCover!.url,
              alt: product.imageCover!.altText || "",
            },
          ]
        : [],
      locale: "it_IT",
      type: "article",
      authors: [`${product.user!.firstName} ${product.user!.lastName}`],
    },
    twitter: {
      card: "summary_large_image",
      title: product.seo.ogTwitterTitle || product.seo.title,
      description:
        product.seo.ogTwitterDescription || product.seo.description || "",
      images: product.imageCover ? [product.imageCover!.url] : [],
      creator: `${product.user!.firstName} ${product.user!.lastName}`,
    },
  };
}
