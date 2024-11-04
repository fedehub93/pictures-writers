import { Metadata } from "next";

import { db } from "@/lib/db";
import { ContentStatus } from "@prisma/client";

export async function getPostMetadataBySlug(
  slug: string
): Promise<Metadata | null> {
  const post = await db.post.findFirst({
    where: {
      slug,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
      seo: true,
      user: true,
    },
    orderBy: { firstPublishedAt: "desc" },
  });

  if (!post || !post.seo) {
    return null;
  }

  return {
    title: post.seo.title,
    description: post.seo.description,
    robots: {
      index: !post.seo.noIndex,
      follow: !post.seo.noFollow,
      googleBot: {
        index: !post.seo.noIndex,
        follow: !post.seo.noFollow,
      },
    },
    alternates: { canonical: post.seo.canonicalUrl },
    openGraph: {
      title: post.seo.ogTwitterTitle || post.seo.title,
      description: post.seo.ogTwitterDescription || post.seo.description || "",
      url: post.seo.ogTwitterUrl || "",
      siteName: "Pictures Writers",
      images: [
        {
          url: post.imageCover!.url,
          alt: post.imageCover!.altText || "",
        },
      ],
      locale: "it_IT",
      type: "article",
      authors: [`${post.user!.firstName} ${post.user!.lastName}`],
      publishedTime: post.firstPublishedAt.toISOString(),
      modifiedTime: post.publishedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.ogTwitterTitle || post.seo.title,
      description: post.seo.ogTwitterDescription || post.seo.description || "",
      images: [post.imageCover!.url],
      creator: `${post.user!.firstName} ${post.user!.lastName}`,
    },
  };
}

export async function getCategoryMetadataBySlug(
  slug: string
): Promise<Metadata | null> {
  const category = await db.category.findFirst({
    where: { slug, isLatest: true },
    include: {
      seo: true,
    },
    orderBy: { firstPublishedAt: "desc" },
  });

  if (!category || !category.seo) {
    return null;
  }

  return {
    title: category.seo.title,
    description: category.seo.description,
    robots: {
      index: !category.seo.noIndex,
      follow: !category.seo.noFollow,
      googleBot: {
        index: !category.seo.noIndex,
        follow: !category.seo.noFollow,
      },
    },
    alternates: { canonical: category.seo.canonicalUrl },
    openGraph: {
      title: category.seo.ogTwitterTitle || category.seo.title,
      description:
        category.seo.ogTwitterDescription || category.seo.description || "",
      url: category.seo.ogTwitterUrl || "",
      siteName: "Pictures Writers",
      locale: "it_IT",
      type: "article",
      publishedTime: category.firstPublishedAt.toISOString(),
      modifiedTime: category.publishedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: category.seo.ogTwitterTitle || category.seo.title,
      description:
        category.seo.ogTwitterDescription || category.seo.description || "",
    },
  };
}

export async function getTagMetdataBySlug(
  slug: string
): Promise<Metadata | null> {
  const tag = await db.tag.findFirst({
    where: { slug, isLatest: true },
    include: {
      seo: true,
    },
    orderBy: { firstPublishedAt: "desc" },
  });

  if (!tag || !tag.seo) {
    return null;
  }

  return {
    title: tag.seo.title,
    description: tag.seo.description,
    robots: {
      index: !tag.seo.noIndex,
      follow: !tag.seo.noFollow,
      googleBot: {
        index: !tag.seo.noIndex,
        follow: !tag.seo.noFollow,
      },
    },
    alternates: { canonical: tag.seo.canonicalUrl },
    openGraph: {
      title: tag.seo.ogTwitterTitle || tag.seo.title,
      description: tag.seo.ogTwitterDescription || tag.seo.description || "",
      url: tag.seo.ogTwitterUrl || "",
      siteName: "Pictures Writers",
      locale: "it_IT",
      type: "article",
      publishedTime: tag.firstPublishedAt.toISOString(),
      modifiedTime: tag.publishedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: tag.seo.ogTwitterTitle || tag.seo.title,
      description: tag.seo.ogTwitterDescription || tag.seo.description || "",
    },
  };
}
