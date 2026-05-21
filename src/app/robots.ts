import { getSettings } from "@/data/settings";
import { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl } = await getSettings();

  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/admin/",
        "/confirm-subscription",
        "/cancel-subscription",
        "/conferma-sottoscrizione",
        "/rimuovi-sottoscrizione",
        "/download-ebooks",
        "/shop/ebooks/download",
        "/cos-e-il-linguaggio-cinematografico-scrivere-per-il cinema",
        "/ebooks/",
        "/ebooks/introduzione-alla-sceneggiatura/",
        "/concorso-tre-colori-2025/",
      ],
    },
    sitemap: [`${siteUrl}/sitemap.xml`],
  };
}
