import { db } from "@/shared/lib/db";

export const getPublishedCategoriesBuilding = async () => {
  const categories = await db.category.findMany({
    include: {
      seo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};
