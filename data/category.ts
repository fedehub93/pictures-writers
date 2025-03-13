import { db } from "@/lib/db";
import { ContentStatus } from "@prisma/client";

export const getPublishedCategories = async () => {
  const categories = await db.category.findMany({
    where: {
      status: { equals: ContentStatus.PUBLISHED },
      posts: {
        some: { status: ContentStatus.PUBLISHED },
      },
      isLatest: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
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

export const getCategoriesString = (
  categories: {
    title: string | null;
  }[]
) => {
  return categories.map((c) => `${c.title}`).join(", ");
};
