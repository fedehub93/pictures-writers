import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

/**
 *
 * @param ids Get Posts by ids
 * @returns
 */

export const getPostsByIds = async (ids: string[]) => {
  try {
    const posts = await db.post.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        rootId: { in: ids },
      },
      select: {
        id: true,
        rootId: true,
        title: true,
        imageCover: { select: { url: true } },
        slug: true,
      },
    });

    return posts;
  } catch (error) {
    console.error(error);
    return [];
  }
};
