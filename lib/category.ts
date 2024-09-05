import { db } from "./db";

export const getPublishedCategories = async () => {
  const categories = await db.category.findMany({
    where: {
      isPublished: true,
      posts: {
        some: { isPublished: true },
      },
    },
    include: {
      versions: {
        take: 1,
        orderBy: {
          publishedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const lastPublishedCategories = categories.map((post) => {
    const lastPublishedCategory = post.versions[0];
    return lastPublishedCategory;
  });

  return lastPublishedCategories;
};

export const getPublishedCategoryById = async (id: string) => {
  const category = await db.category.findFirst({
    where: {
      id: id,
      isPublished: true,
    },
    include: {
      versions: {
        take: 1,
        orderBy: {
          publishedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const lastPublishedCategory = { ...category?.versions[0] };

  return lastPublishedCategory;
};

export const getPublishedCategoryBySlug = async (slug: string) => {
  const categoryVersion = await db.categoryVersion.findFirst({
    where: {
      slug,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  if (!categoryVersion) {
    return null;
  }

  const post = await getPublishedCategoryById(categoryVersion.categoryId);
  return post;
};
