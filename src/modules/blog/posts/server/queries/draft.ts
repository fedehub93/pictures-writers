import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

const DRAFT_STATUSES = [
  ContentStatus.DRAFT,
  ContentStatus.CHANGED,
  ContentStatus.SCHEDULED,
];

export const getPublishedDraftPostsBuilding = async () => {
  const roots = await db.postRoot.findMany({
    where: {
      currentVersion: { is: { status: { in: DRAFT_STATUSES } } },
    },
    select: {
      id: true,
      slug: true,
      currentVersion: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return roots.map((root) => ({
    id: root.currentVersion!.id,
    rootId: root.id,
    slug: root.slug,
  }));
};

/**
 *
 * @param slug Get Draft Post by Slug
 * @returns
 */

export const getDraftPostBySlug = async (slug: string) => {
  const root = await db.postRoot.findFirst({
    where: { slug },
    include: {
      currentVersion: {
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

  if (!root || !root.currentVersion) return null;

  const version = root.currentVersion;

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

export type GetDraftPostBySlug = Awaited<ReturnType<typeof getDraftPostBySlug>>;
