import { db } from "@/lib/db";
import type { MetadataRoute } from "next";

const generateBlogPostsSitemap = async () => {
  const posts = await db.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["rootId"],
  });

  const mappedPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://pictureswriters.com/${post.slug}`,
    lastModified: post.createdAt,
    changeFrequency: "monthly",
    priority: 1,
  }));

  return mappedPosts;
};

const generateBlogCategoriesSitemap = async () => {
  const categories = await db.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["rootId"],
  });

  const mappedCategories: MetadataRoute.Sitemap = categories.map((post) => ({
    url: `https://pictureswriters.com/blog/${post.slug}`,
    lastModified: post.createdAt,
    changeFrequency: "monthly",
    priority: 1,
  }));

  return mappedCategories;
};

const generateBlogTagsSitemap = async () => {
  const tags = await db.tag.findMany({
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["rootId"],
  });

  const mappedTags: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `https://pictureswriters.com/blog/${tag.slug}`,
    lastModified: tag.createdAt,
    changeFrequency: "monthly",
    priority: 1,
  }));

  return mappedTags;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await generateBlogPostsSitemap();
  const categories = await generateBlogCategoriesSitemap();
  const tags = await generateBlogTagsSitemap();
  return [
    {
      url: "https://pictureswriters.com",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: "https://pictureswriters.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://pictureswriters.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: "https://pictureswriters.com/contatti",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...posts,
    ...categories,
    ...tags,
  ];
}
