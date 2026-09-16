import type { MetadataRoute } from "next";

import { ContentStatus, ProductType } from "@/generated/prisma";

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

const generateProductsSitemap = async () => {
  const { siteShopUrl } = await getSettings();

  const products = await db.product.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      type: {
        in: [ProductType.EBOOK, ProductType.WEBINAR, ProductType.SERVICE],
      },
    },
    select: {
      slug: true,
      createdAt: true,
      category: {
        select: {
          slug: true,
        },
      },
      seo: {
        select: {
          canonicalUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedProducts: MetadataRoute.Sitemap = products
    .filter((product) => !product.seo?.canonicalUrl)
    .map((product) => ({
      url: `${siteShopUrl}/${product.category!.slug}/${product.slug}/`,
      lastModified: product.createdAt,
      changeFrequency: "monthly",
      priority: 1,
    }));

  return mappedProducts;
};

const generateProductCategoriesSitemap = async () => {
  const { siteShopUrl } = await getSettings();

  const categories = await db.productCategory.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      products: {
        some: {
          type: { in: [ProductType.EBOOK, ProductType.SERVICE] },
        },
      },
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
    .map((category) => ({
      url: `${siteShopUrl}/${category.slug}/`,
      lastModified: category.publishedAt,
      changeFrequency: "monthly",
      priority: 1,
    }));

  return mappedCategories;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl, siteShopUrl } = await getSettings();
  const posts = await generateBlogPostsSitemap();
  const categories = await generateBlogCategoriesSitemap();
  const tags = await generateBlogTagsSitemap();
  const products = await generateProductsSitemap();
  const productCategories = await generateProductCategoriesSitemap();

  if (!siteUrl) return [];

  return [
    {
      url: `${siteUrl}/`,
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
      url: `${siteShopUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...posts,
    ...categories,
    ...tags,
    ...products,
    ...productCategories,
  ];
}
