import { getSettings } from "@/data/settings";
import { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await getSettings();
  console.log(seo);

  return {
    rules: {
      userAgent: "*",
      disallow: "/",
      // allow: ["/"],
      // disallow: [
      //   "/search?q=",
      //   "/admin/",
      //   "/confirm-subscription",
      //   "/cancel-subscription",
      //   "/download-ebooks",
      //   "/cos-e-il-linguaggio-cinematografico-scrivere-per-il cinema",
      // ],
    },
    sitemap: ["https://pictureswriters.com/sitemap.xml"],
  };
}
