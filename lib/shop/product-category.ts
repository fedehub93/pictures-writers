import { ContentStatus } from "@prisma/client";
import { db } from "../db";

export const getPublishedCategoriesBuilding = async () => {
  const categories = await db.productCategory.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      seo: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return categories;
};

export const getPublishedCategoryById = async (id: string) => {
  const category = await db.productCategory.findFirst({
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
  const category = await db.productCategory.findFirst({
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

export const createNewVersionProductCategory = async (
  rootId: string,
  values: any
) => {
  // Trovo ultima versione pubblicata
  const publishedCategory = await db.productCategory.findFirst({
    where: { rootId, status: ContentStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedCategory) {
    return { message: "Category not found", status: 404, category: null };
  }

  const category = await db.productCategory.create({
    data: {
      ...publishedCategory,
      ...values,
      id: undefined,
      version: publishedCategory.version + 1,
      status: ContentStatus.CHANGED,
      isLatest: false,
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
