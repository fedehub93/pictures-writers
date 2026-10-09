import { Category, ProductCategory, Tag } from "@/generated/prisma";
import { db } from "./db";

const updateSeoRootId = async (seoId: string, rootId: string) => {
  const updatedPostSeo = await db.seo.update({
    where: { id: seoId },
    data: {
      rootId,
    },
  });

  return updatedPostSeo;
};

export const createCategorySeo = async (category: Category) => {
  const categorySeo = await db.seo.create({
    data: {
      title: category.title,
      version: 1,
      description: category.description,
      ogTwitterTitle: category.title,
      ogTwitterDescription: category.description,
      ogTwitterType: "card",
      ogTwitterLocale: "it_IT",
      categories: {
        connect: { id: category.id },
      },
    },
  });

  if (!categorySeo) {
    return null;
  }

  const updatedCategorySeo = await updateSeoRootId(
    categorySeo.id,
    categorySeo.id,
  );
  return updatedCategorySeo;
};

export const createTagSeo = async (tag: Tag) => {
  const tagSeo = await db.seo.create({
    data: {
      title: tag.title,
      version: 1,
      description: tag.description,
      ogTwitterTitle: tag.title,
      ogTwitterDescription: tag.description,
      ogTwitterType: "card",
      ogTwitterLocale: "it_IT",
      tags: {
        connect: { id: tag.id },
      },
    },
  });

  if (!tagSeo) {
    return null;
  }

  const updatedTagSeo = await updateSeoRootId(tagSeo.id, tagSeo.id);
  return updatedTagSeo;
};

export const createProductCategorySeo = async (category: ProductCategory) => {
  const categorySeo = await db.seo.create({
    data: {
      title: category.title,
      version: 1,
      description: category.description,
      ogTwitterTitle: category.title,
      ogTwitterDescription: category.description,
      ogTwitterType: "card",
      ogTwitterLocale: "it_IT",
      productCategories: {
        connect: { id: category.id },
      },
    },
  });

  if (!categorySeo) {
    return null;
  }

  const updatedCategorySeo = await updateSeoRootId(
    categorySeo.id,
    categorySeo.id,
  );
  return updatedCategorySeo;
};
