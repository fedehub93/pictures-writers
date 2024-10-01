import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
