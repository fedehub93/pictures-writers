import { db } from "@/shared/lib/db";

export const getPublishedCategoryBySlug = async (slug: string) => {
  const category = await db.category.findFirst({
    where: { slug, isLatest: true },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  if (!category) {
    return null;
  }

  return category;
};
