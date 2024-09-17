import { ContentStatus } from "@prisma/client";
import { db } from "./db";

export const getPublishedCategories = async () => {
  const categories = await db.category.findMany({
    where: {
      posts: {
        some: { status: ContentStatus.PUBLISHED },
      },
    },
    distinct: ["rootId"],
    orderBy: {
      createdAt: "desc",
    },
  });

  const lastPublishedCategories = categories.map((category) => {
    const lastPublishedCategory = category;
    return lastPublishedCategory;
  });

  return lastPublishedCategories;
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
    where: {
      slug,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  if (!category) {
    return null;
  }

  return category;
};

export const createNewVersionCategory = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedCategory = await db.category.findFirst({
    where: { rootId, status: ContentStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedCategory) {
    return { message: "Category not found", status: 404, category: null };
  }

  const category = await db.category.create({
    data: {
      ...publishedCategory,
      ...values,
      id: undefined,
      status: ContentStatus.CHANGED,
      version: publishedCategory.version + 1,
      rootId: undefined,
      root: {
        connect: { id: publishedCategory.rootId },
      },
      seoId: undefined,
      seo: {
        connect: { id: publishedCategory.seoId },
      },
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  return { message: "", status: 200, category };
};
