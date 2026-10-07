import { ContentStatus, ProductType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedProductsBuilding = async () => {
  const products = await db.product.findMany({
    where: {
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: { not: ProductType.AFFILIATE },
    },
    select: {
      id: true,
      slug: true,
      type: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products;
};
