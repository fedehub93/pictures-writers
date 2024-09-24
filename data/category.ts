import { db } from "@/lib/db";
import { ContentStatus } from "@prisma/client";

export const getPublishedCategories = async () => {
  const categories = await db.category.findMany({
    where: {
      status: { equals: ContentStatus.PUBLISHED },
      posts: {
        some: { status: ContentStatus.PUBLISHED },
      },
    },
    distinct: ["rootId"],
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};

export const getPublishedCategoryById = async (id: string) => {
  const category = await db.category.findFirst({
    where: {
      id: id,
      status: ContentStatus.PUBLISHED,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return category;
};

export const getPublishedCategoryBySlug = async (slug: string) => {
  const category = await db.category.findFirst({
    where: { slug },
    distinct: ["rootId"],
    orderBy: {
      publishedAt: "desc",
    },
  });

  if (!category) {
    return null;
  }

  return category;
};
