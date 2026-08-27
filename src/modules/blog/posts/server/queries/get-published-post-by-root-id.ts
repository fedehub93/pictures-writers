/**
 *
 * @param rootId Get Published Post By Root Id
 * @returns
 */

import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedPostByRootId = async (rootId: string) => {
  const post = await db.post.findFirst({
    where: {
      rootId: rootId,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      description: true,
      slug: true,
      imageCover: {
        select: {
          id: true,
          url: true,
          altText: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return post;
};

export type GetPublishedPostByRootId = Awaited<
  ReturnType<typeof getPublishedPostByRootId>
>;
