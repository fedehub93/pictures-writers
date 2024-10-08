import { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
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
        "/ebooks/download",
        "/cos-e-il-linguaggio-cinematografico-scrivere-per-il cinema",
      ],
    },
    sitemap: ["https://pictureswriters.com/sitemap.xml"],
  };
}
