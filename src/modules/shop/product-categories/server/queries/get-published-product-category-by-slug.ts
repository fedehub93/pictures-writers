import { db } from "@/shared/lib/db";

type GetPublishedProductCategoryBySlug = {
  slug: string;
};

export const getPublishedProductCategoryBySlug = async ({
  slug,
}: GetPublishedProductCategoryBySlug) => {
  try {
    const productCategory = await db.productCategory.findUnique({
      where: { slug },
      select: {
        id: true,
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
