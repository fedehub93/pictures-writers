/**
 *
 * @param slug Get Published Post By Slug
 * @returns
 */

import { db } from "@/shared/lib/db";

export const getPublishedPostBySlug = async (slug: string) => {
  const root = await db.postRoot.findUnique({
    where: {
      slug,
    },
    include: {
      liveVersion: {
        include: {
          seo: {
            select: {
              title: true,
              description: true,
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
          tags: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          imageCover: {
            select: {
              url: true,
              altText: true,
            },
          },
          authors: {
            select: {
              user: true,
              sort: true,
            },
            orderBy: {
              sort: "asc",
            },
          },
          faqs: {
            select: {
              question: true,
              answer: true,
            },
            orderBy: {
              sort: "asc",
            },
          },
        },
      },
    },
  });

  if (!root || !root.liveVersion) return null;

  const version = root.liveVersion;

  return {
    id: version.id,
    rootId: root.id,
    title: version.title,
    slug: root.slug,
    description: version.description,
    tiptapBodyData: version.tiptapBodyData,
    publishedAt: version.publishedAt,
    firstPublishedAt: root.firstPublishedAt,
    updatedAt: version.updatedAt,
    seo: version.seo,
    categories: version.categories,
    tags: version.tags,
    imageCover: version.imageCover,
    authors: version.authors,
    faqs: version.faqs,
  };
};

export type GetPublishedPostBySlug = Awaited<
  ReturnType<typeof getPublishedPostBySlug>
>;
