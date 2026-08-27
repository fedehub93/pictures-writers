/**
 *
 * @param slug Get Published Post By Slug
 * @returns
 */

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

export const getPublishedPostBySlug = async (slug: string) => {
  const post = await db.post.findFirst({
    where: {
      slug,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      description: true,
      editorType: true,
      bodyData: true,
      tiptapBodyData: true,
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
        where: {
          isLatest: true,
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

export type GetPublishedPostBySlug = Awaited<
  ReturnType<typeof getPublishedPostBySlug>
>;
