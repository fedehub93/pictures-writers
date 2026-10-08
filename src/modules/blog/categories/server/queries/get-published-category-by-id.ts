import { db } from "@/shared/lib/db";

export const getPublishedCategoryById = async (id: string) => {
  const category = await db.category.findUnique({
    where: { id },
  });

  return category;
};
