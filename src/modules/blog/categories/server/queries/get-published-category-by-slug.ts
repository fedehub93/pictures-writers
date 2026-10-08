import { db } from "@/shared/lib/db";

export const getPublishedCategoryBySlug = async (slug: string) => {
  const category = await db.category.findUnique({
    where: { slug },
  });

  if (!category) {
    return null;
  }

  return category;
};
