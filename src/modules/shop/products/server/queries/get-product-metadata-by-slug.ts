import { Metadata } from "next";

import { getSettings } from "@/data/settings";

import { db } from "@/shared/lib/db";

export async function getProductMetadataBySlug(
  slug: string,
): Promise<Metadata | null> {
  const { siteName, siteShopUrl } = await getSettings();

  const root = await db.productRoot.findFirst({
    where: {
      slug,
      liveVersion: { isNot: null },
    },
    include: {
      liveVersion: {
        include: {
          imageCover: true,
          seo: true,
          category: true,
          user: true,
        },
      },
    },
  });

  const version = root?.liveVersion;

  if (!root || !version || !version.seo) {
    return null;
  }

  return {
    title: version.seo.title,
    description: version.seo.description,
    robots: {
      index: !version.seo.noIndex,
      follow: !version.seo.noFollow,
      googleBot: {
        index: !version.seo.noIndex,
        follow: !version.seo.noFollow,
      },
    },
    alternates: {
      canonical: version.seo.canonicalUrl
        ? version.seo.canonicalUrl
        : `${siteShopUrl}/${version.category?.slug}/${root.slug}/`,
    },
    openGraph: {
      title: version.seo.ogTwitterTitle || version.seo.title,
      description:
        version.seo.ogTwitterDescription || version.seo.description || "",
      url: version.seo.ogTwitterUrl || "",
      siteName: siteName!,
      images: version.imageCover
        ? [
            {
              url: version.imageCover.url,
              alt: version.imageCover.altText || "",
            },
          ]
        : [],
      locale: "it_IT",
      type: "article",
      authors: [
        `${version.user!.firstName} ${version.user!.lastName}`,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: version.seo.ogTwitterTitle || version.seo.title,
      description:
        version.seo.ogTwitterDescription || version.seo.description || "",
      images: version.imageCover ? [version.imageCover.url] : [],
      creator: `${version.user!.firstName} ${version.user!.lastName}`,
    },
  };
}
