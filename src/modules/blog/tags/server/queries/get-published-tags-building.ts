import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedTagsBuilding = async () => {
  const tags = await db.tag.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      seo: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return tags;
};
