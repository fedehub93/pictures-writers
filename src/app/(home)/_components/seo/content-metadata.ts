import { Metadata } from "next";

import { db } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma";
import { getAuthorsString } from "@/data/user";
import { getSettings } from "@/data/settings";

export async function getPageMetadataBySlug(
  slug: string,
): Promise<Metadata | null> {
  const { siteName, siteUrl } = await getSettings();

  const root = await db.pageRoot.findUnique({
    where: { slug },
    select: {
      slug: true,
      firstPublishedAt: true,
      liveVersion: {
        select: {
          publishedAt: true,
          seo: {
            select: {
              title: true,
              description: true,
              canonicalUrl: true,
              noIndex: true,
              noFollow: true,
              ogTwitterTitle: true,
              ogTwitterDescription: true,
              ogTwitterUrl: true,
            },
          },
        },
      },
    },
  });

  const liveVersion = root?.liveVersion;

  if (!root || !liveVersion?.seo) {
    return null;
  }

  return {
    title: liveVersion.seo.title,
    description: liveVersion.seo.description,
    robots: {
      index: !liveVersion.seo.noIndex,
      follow: !liveVersion.seo.noFollow,
      googleBot: {
        index: !liveVersion.seo.noIndex,
        follow: !liveVersion.seo.noFollow,
      },
    },
    alternates: {
      canonical: liveVersion.seo.canonicalUrl
        ? liveVersion.seo.canonicalUrl
        : `${siteUrl}/${root.slug}/`,
    },
    openGraph: {
      title: liveVersion.seo.ogTwitterTitle || liveVersion.seo.title,
      description:
        liveVersion.seo.ogTwitterDescription || liveVersion.seo.description || "",
      url: liveVersion.seo.ogTwitterUrl || "",
      siteName: siteName!,
      locale: "it_IT",
      type: "article",
      publishedTime: root.firstPublishedAt?.toISOString(),
      modifiedTime: liveVersion.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: liveVersion.seo.ogTwitterTitle || liveVersion.seo.title,
      description:
        liveVersion.seo.ogTwitterDescription || liveVersion.seo.description || "",
    },
  };
}

export async function getPostMetadataBySlug(
  slug: string,
): Promise<Metadata | null> {
  const { siteName, siteUrl } = await getSettings();

  const post = await db.post.findFirst({
    where: {
      slug,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    select: {
      title: true,
      slug: true,
      seo: {
        select: {
          title: true,
          description: true,
          canonicalUrl: true,
          noIndex: true,
          noFollow: true,
          ogTwitterTitle: true,
          ogTwitterDescription: true,
          ogTwitterUrl: true,
        },
      },
      imageCover: {
        select: {
          url: true,
          altText: true,
        },
      },
      postAuthors: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      firstPublishedAt: true,
      publishedAt: true,
    },
    orderBy: { firstPublishedAt: "desc" },
  });

  if (!post || !post.seo) {
    return null;
  }

  const authorsString = getAuthorsString(post.postAuthors.map((v) => v.user));
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
    alternates: {
      canonical: post.seo.canonicalUrl
        ? post.seo.canonicalUrl
        : `${siteUrl}/${post.slug}/`,
    },
    openGraph: {
      title: post.seo.ogTwitterTitle || post.seo.title,
      description: post.seo.ogTwitterDescription || post.seo.description || "",
      url: post.seo.ogTwitterUrl || "",
      siteName: siteName!,
      images: post.imageCover
        ? [
            {
              url: post.imageCover!.url,
              alt: post.imageCover!.altText || "",
            },
          ]
        : [],
      locale: "it_IT",
      type: "article",
      authors: [authorsString],
      publishedTime: post.firstPublishedAt?.toISOString(),
      modifiedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.ogTwitterTitle || post.seo.title,
      description: post.seo.ogTwitterDescription || post.seo.description || "",
      images: post.imageCover ? [post.imageCover.url] : [],
      creator: authorsString,
    },
  };
}

export async function getCategoryMetadataBySlug(
  slug: string,
): Promise<Metadata | null> {
  const { siteName, siteUrl } = await getSettings();

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
    alternates: {
      canonical: category.seo.canonicalUrl
        ? category.seo.canonicalUrl
        : `${siteUrl}/blog/${category.slug}/`,
    },
    openGraph: {
      title: category.seo.ogTwitterTitle || category.seo.title,
      description:
        category.seo.ogTwitterDescription || category.seo.description || "",
      url: category.seo.ogTwitterUrl || "",
      siteName: siteName!,
      locale: "it_IT",
      type: "article",
      publishedTime: category.firstPublishedAt?.toISOString(),
      modifiedTime: category.publishedAt?.toISOString(),
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
  slug: string,
): Promise<Metadata | null> {
  const { siteName, siteUrl } = await getSettings();

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
    alternates: {
      canonical: tag.seo.canonicalUrl
        ? tag.seo.canonicalUrl
        : `${siteUrl}/blog/${tag.slug}/`,
    },
    openGraph: {
      title: tag.seo.ogTwitterTitle || tag.seo.title,
      description: tag.seo.ogTwitterDescription || tag.seo.description || "",
      url: tag.seo.ogTwitterUrl || "",
      siteName: siteName!,
      locale: "it_IT",
      type: "article",
      publishedTime: tag.firstPublishedAt?.toISOString(),
      modifiedTime: tag.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: tag.seo.ogTwitterTitle || tag.seo.title,
      description: tag.seo.ogTwitterDescription || tag.seo.description || "",
    },
  };
}

