import { ProductType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedProductsBuilding = async () => {
  const roots = await db.productRoot.findMany({
    where: {
      type: { not: ProductType.AFFILIATE },
      liveVersion: { isNot: null },
    },
    select: {
      id: true,
      slug: true,
      type: true,
      liveVersion: {
        select: {
          id: true,
          category: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return roots
    .filter((root) => Boolean(root.liveVersion))
    .map((root) => ({
      id: root.liveVersion!.id,
      rootId: root.id,
      slug: root.slug,
      type: root.type,
      category: root.liveVersion!.category,
    }));
};
