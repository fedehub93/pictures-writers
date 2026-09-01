import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

export const getPublishedDraftPostsBuilding = async () => {
  const posts = await db.post.findMany({
    where: {
      OR: [
        {
          isLatest: true,
          status: { in: [ContentStatus.DRAFT, ContentStatus.SCHEDULED] },
        },
        {
          isLatest: false,
          status: ContentStatus.CHANGED,
        },
      ],
    },
    select: {
      id: true,
      rootId: true,
      slug: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return posts;
};

/**
 *
 * @param slug Get Draft Post by Slug
 * @returns
 */

export const getDraftPostBySlug = async (slug: string) => {
  const post = await db.post.findFirst({
    where: {
      slug,
      OR: [
        {
          isLatest: true,
          status: { in: [ContentStatus.DRAFT, ContentStatus.SCHEDULED] },
        },
        {
          isLatest: false,
          status: ContentStatus.CHANGED,
        },
      ],
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      description: true,
      editorType: true,
      tiptapBodyData: true,
      bodyData: true,
      publishedAt: true,
      firstPublishedAt: true,
      updatedAt: true,
      seo: {
        select: {
          title: true,
          description: true,
        },
      },
      postCategories: {
        select: {
          category: {
            select: {
              rootId: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      tags: {
        select: {
          rootId: true,
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
      postAuthors: {
        select: {
          user: true,
          sort: true,
        },
        orderBy: {
          sort: "asc",
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return post;
};

export type GetDraftPostBySlug = Awaited<ReturnType<typeof getDraftPostBySlug>>;
