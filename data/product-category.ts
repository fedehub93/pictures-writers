/**
 * GetProductsPaginatedByFilter
 */

import { db } from "@/lib/db";
import { ContentStatus } from "@prisma/client";

type GetPublishedProductCategoryBySlug = {
  slug: string;
};

export const getPublishedProductCategoryBySlug = async ({
  slug,
}: GetPublishedProductCategoryBySlug) => {
  try {
    const productCategory = await db.productCategory.findFirst({
      where: {
        slug,
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
      select: {
        id: true,
        rootId: true,
        title: true,
        description: true,
        slug: true,
        seo: {
          select: {
            title: true,
            description: true,
            canonicalUrl: true,
          },
        },
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return productCategory;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export type GetPublishedProductCategoryBySlugReturn = Awaited<
  ReturnType<typeof getPublishedProductCategoryBySlug>
>;
