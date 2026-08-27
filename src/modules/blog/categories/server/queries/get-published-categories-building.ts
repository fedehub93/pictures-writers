import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedCategoriesBuilding = async () => {
  const categories = await db.category.findMany({
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

  return categories;
};
