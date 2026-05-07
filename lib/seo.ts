import { Category, Page, Post, Product, Tag } from "@/generated/prisma";
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

export const createPageSeo = async (page: Page) => {
  const pageSeo = await db.seo.create({
    data: {
      title: page.title,
      version: 1,
      description: "",
      ogTwitterTitle: page.title,
      ogTwitterDescription: "",
      ogTwitterType: "card",
      ogTwitterLocale: "it_IT",
      // ogTwitterImageId: post.imageCoverId,
      pages: {
        connect: { id: page.id },
      },
    },
  });

  if (!pageSeo) {
    return null;
  }

  const updatedPageSeo = await updateSeoRootId(pageSeo.id, pageSeo.id);
  return updatedPageSeo;
};

export const createPostSeo = async (post: Post) => {
  const postSeo = await db.seo.create({
    data: {
      title: post.title,
      version: 1,
      description: post.description,
      ogTwitterTitle: post.title,
      ogTwitterDescription: post.description,
      ogTwitterType: "card",
      ogTwitterLocale: "it_IT",
      ogTwitterImageId: post.imageCoverId,
      posts: {
        connect: { id: post.id },
      },
    },
  });

  if (!postSeo) {
    return null;
  }

  const updatedPostSeo = await updateSeoRootId(postSeo.id, postSeo.id);
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

export const createProductSeo = async (product: Product) => {
  const productSeo = await db.seo.create({
    data: {
      title: product.title,
      version: 1,
      description: "",
      ogTwitterTitle: product.title,
      ogTwitterDescription: "",
      ogTwitterType: "card",
      ogTwitterLocale: "it_IT",
      products: {
        connect: { id: product.id },
      },
    },
  });

  if (!productSeo) {
    return null;
  }

  const productUPdatedSeo = await updateSeoRootId(productSeo.id, productSeo.id);
  return productUPdatedSeo;
};

export const createProductCategorySeo = async (category: Category) => {
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
