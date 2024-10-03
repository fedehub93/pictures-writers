import { db } from "@/lib/db";
import { ContentStatus } from "@prisma/client";
import type { MetadataRoute } from "next";

const generateBlogPostsSitemap = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const mappedPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://pictureswriters.com/${post.slug}/`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 1,
  }));

  return mappedPosts;
};

const generateBlogPagesSitemap = async () => {
  const totalPosts = await db.post.count({
    where: { status: ContentStatus.PUBLISHED, isLatest: true },
  });
  const pages = Math.ceil(totalPosts / 10);

  const blogs = Array.from({ length: pages }, (_, index) => ({
    page: index + 1,
  })).filter((blog) => blog.page > 1);

  const mappedBlogPages: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `https://pictureswriters.com/blog/${blog.page}/`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return mappedBlogPages;
};

const generateBlogCategoriesSitemap = async () => {
  const categories = await db.category.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const mappedCategories: MetadataRoute.Sitemap = categories.map((post) => ({
    url: `https://pictureswriters.com/blog/${post.slug}/`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 1,
  }));

  return mappedCategories;
};

const generateBlogTagsSitemap = async () => {
  const tags = await db.tag.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const mappedTags: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `https://pictureswriters.com/blog/${tag.slug}/`,
    lastModified: tag.publishedAt,
    changeFrequency: "monthly",
    priority: 1,
  }));

  return mappedTags;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPages = await generateBlogPagesSitemap();
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
      url: "https://pictureswriters.com/about/",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },

    {
      url: "https://pictureswriters.com/contatti/",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://pictureswriters.com/feedback-gratuito-sceneggiatura/",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://pictureswriters.com/policy/",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://pictureswriters.com/blog/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...blogPages,
    ...posts,
    ...categories,
    ...tags,
  ];
}
