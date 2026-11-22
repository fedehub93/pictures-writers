import { Metadata } from "next";

import { getSettings } from "@/data/settings";

import { db } from "@/shared/lib/db";
import {
  mediaPresentationSelect,
  withMediaUrl,
} from "@/modules/media/lib/media-address";
import { absoluteMediaUrl } from "@/modules/media/server/media-url";

export async function getProductMetadataBySlug(
  slug: string,
): Promise<Metadata | null> {
  const { siteName, siteUrl, siteShopUrl } = await getSettings();

  const root = await db.productRoot.findFirst({
    where: {
      slug,
      liveVersion: { isNot: null },
    },
    include: {
      liveVersion: {
        include: {
          imageCover: { select: { ...mediaPresentationSelect } },
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

  // Stored Media addresses are relative; social metadata needs one a crawler
  // can fetch without knowing the site.
  const imageCover = version.imageCover
    ? withMediaUrl(version.imageCover)
    : null;
  const coverImageUrl = imageCover
    ? absoluteMediaUrl(imageCover.url, siteUrl)
    : null;

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
      images: coverImageUrl
        ? [
            {
              url: coverImageUrl,
              alt: imageCover?.altText || "",
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
      images: coverImageUrl ? [coverImageUrl] : [],
      creator: `${version.user!.firstName} ${version.user!.lastName}`,
    },
  };
}
