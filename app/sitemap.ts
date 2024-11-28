import type { MetadataRoute } from "next";

import { ContentStatus, ProductCategory } from "@prisma/client";

import { db } from "@/lib/db";
import { getSettings } from "@/data/settings";

const generateBlogPostsSitemap = async () => {
  const { siteUrl } = await getSettings();

  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      seo: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const mappedPosts: MetadataRoute.Sitemap = posts
    .filter((post) => !post.seo?.canonicalUrl)
    .map((post) => ({
      url: `${siteUrl}/${post.slug}/`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly",
      priority: 1,
    }));

  return mappedPosts;
};

const generateBlogPagesSitemap = async () => {
  const { siteUrl } = await getSettings();

  const totalPosts = await db.post.count({
    where: { status: ContentStatus.PUBLISHED, isLatest: true },
  });
  const pages = Math.ceil(totalPosts / 10);

  const blogs = Array.from({ length: pages }, (_, index) => ({
    page: index + 1,
  })).filter((blog) => blog.page > 1);

  const mappedBlogPages: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${siteUrl}/blog/${blog.page}/`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return mappedBlogPages;
};

const generateBlogCategoriesSitemap = async () => {
  const { siteUrl } = await getSettings();

  const categories = await db.category.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      seo: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const mappedCategories: MetadataRoute.Sitemap = categories
    .filter((category) => !category.seo?.canonicalUrl)
    .map((post) => ({
      url: `${siteUrl}/blog/${post.slug}/`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly",
      priority: 1,
    }));

  return mappedCategories;
};

const generateBlogTagsSitemap = async () => {
  const { siteUrl } = await getSettings();

  const tags = await db.tag.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      seo: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const mappedTags: MetadataRoute.Sitemap = tags
    .filter((tag) => !tag.seo?.canonicalUrl)
    .map((tag) => ({
      url: `${siteUrl}/blog/${tag.slug}/`,
      lastModified: tag.publishedAt,
      changeFrequency: "monthly",
      priority: 1,
    }));

  return mappedTags;
};

const generateEbooksSitemap = async () => {
  const { siteUrl } = await getSettings();

  const ebooks = await db.product.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      category: ProductCategory.EBOOK,
    },
    include: {
      seo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedEbooks: MetadataRoute.Sitemap = ebooks
    .filter((ebook) => !ebook.seo?.canonicalUrl)
    .map((ebook) => ({
      url: `${siteUrl}/ebooks/${ebook.slug}/`,
      lastModified: ebook.createdAt,
      changeFrequency: "monthly",
      priority: 1,
    }));

  return mappedEbooks;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = await getSettings();
  const blogPages = await generateBlogPagesSitemap();
  const posts = await generateBlogPostsSitemap();
  const categories = await generateBlogCategoriesSitemap();
  const tags = await generateBlogTagsSitemap();
  const ebooks = await generateEbooksSitemap();

  if (!siteUrl) return [];

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },

    {
      url: `${siteUrl}/contatti/`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/feedback-gratuito-sceneggiatura/`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/policy/`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/blog/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/ebooks/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...blogPages,
    ...posts,
    ...categories,
    ...tags,
    ...ebooks,
  ];
}
