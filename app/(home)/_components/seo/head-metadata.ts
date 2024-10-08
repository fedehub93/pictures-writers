import { Metadata } from "next";

import { getSettings } from "@/data/settings";

export async function getHeadMetadata(): Promise<Metadata | null> {
  const { seo } = await getSettings();

  if (!seo) {
    return null;
  }
  
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
      url: "https://pictureswriters.com",
      type: "website",
    },
  };
}
