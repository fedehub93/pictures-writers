import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedPostsBuilding = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
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
