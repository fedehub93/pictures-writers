import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedPostById = async (id: string) => {
  const post = await db.post.findFirst({
    where: {
      id: id,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const lastPublishedPost = { ...post };

  return lastPublishedPost;
};
