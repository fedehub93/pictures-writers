import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

type GetDraftProductCategoryBySlug = {
  slug: string;
};

export const getDraftProductCategoryBySlug = async ({
  slug,
}: GetDraftProductCategoryBySlug) => {
  try {
    const productCategory = await db.productCategory.findFirst({
      where: {
        slug,
        OR: [
          {
            status: ContentStatus.DRAFT,
            isLatest: true,
          },
          {
            status: ContentStatus.CHANGED,
            isLatest: false,
          },
        ],
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

export type GetDraftProductCategoryBySlugReturn = Awaited<
  ReturnType<typeof getDraftProductCategoryBySlug>
>;
