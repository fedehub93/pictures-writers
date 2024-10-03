import { Category, Ebook, Post, Tag } from "@prisma/client";
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
    categorySeo.id
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

export const createEbookSeo = async (ebook: Ebook) => {
  const ebookSeo = await db.seo.create({
    data: {
      title: ebook.title,
      version: 1,
      description: ebook.description,
      ogTwitterTitle: ebook.title,
      ogTwitterDescription: ebook.description,
      ogTwitterType: "card",
      ogTwitterLocale: "it_IT",
      ebooks: {
        connect: { id: ebook.id },
      },
    },
  });

  if (!ebookSeo) {
    return null;
  }

  const ebookUPdatedSeo = await updateSeoRootId(ebookSeo.id, ebookSeo.id);
  return ebookUPdatedSeo;
};
