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
