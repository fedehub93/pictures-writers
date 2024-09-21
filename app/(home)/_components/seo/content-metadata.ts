import { db } from "@/lib/db";
import { Media, Post, Seo, User } from "@prisma/client";
import { Metadata } from "next";

export async function getPostMetadataBySlug(
  slug: string
): Promise<Metadata | null> {
  const post = (await db.post.findFirst({
    where: { slug },
    include: {
      imageCover: true,
      seo: true,
      user: true,
    },
    distinct: ["rootId"],
    orderBy: { createdAt: "desc" },
  })) as Post & {
    seo: Seo;
    imageCover: Media;
    user: User;
  };

  if (!post) return null;
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
          url: post.imageCover.url,
          alt: post.imageCover.altText || "",
        },
      ],
      locale: "it_IT",
      type: "article",
      authors: [`${post.user.firstName} ${post.user.lastName}`],
      publishedTime: post.firstPublishedAt.toISOString(),
      modifiedTime: post.publishedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.ogTwitterTitle || post.seo.title,
      description: post.seo.ogTwitterDescription || post.seo.description || "",
      images: [post.imageCover.url],
      creator: `${post.user.firstName} ${post.user.lastName}`,
    },
  };
}
