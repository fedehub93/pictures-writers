import { db } from "@/lib/db";
import { Media, Post, Seo, User } from "@prisma/client";
import { Metadata } from "next";

export async function getPostMetadataBySlug(
  slug: string
): Promise<Metadata | null> {
  const post = await db.post.findFirst({
    where: { slug, isLatest: true },
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
