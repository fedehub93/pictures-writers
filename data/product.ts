import { ContentStatus } from "@prisma/client";

import { db } from "@/lib/db";

export const getPublishedProductByRootId = async (rootId: string) => {
  const product = await db.product.findFirst({
    where: {
      rootId,
      isLatest: true,
      status: ContentStatus.PUBLISHED,
    },
    include: {
      imageCover: true,
      seo: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return product;
};

export type GetPublishedProductByRootId = Awaited<
  ReturnType<typeof getPublishedProductByRootId>
>;
