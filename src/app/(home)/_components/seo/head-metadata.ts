import { Metadata } from "next";

import { getSettings } from "@/data/settings";

export async function getHeadMetadata(): Promise<Metadata | null> {
  const { seo, siteUrl, siteName, logoUrl } = await getSettings();

  if (!seo) {
    return null;
  }

  const imageUrl = logoUrl ? `${siteUrl}${logoUrl}` : undefined;

  return {
    title: seo.title,
    robots: {
      index: !seo.noIndex,
      follow: !seo.noFollow,
      googleBot: {
        index: !seo.noIndex,
        follow: !seo.noFollow,
      },
    },
    description: seo.description,
    openGraph: {
      url: `${siteUrl}/`,
      type: "website",
      siteName: siteName ?? seo.title,
      locale: "it_IT",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
