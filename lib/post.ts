import { ContentStatus } from "@prisma/client";
import { db } from "@/lib/db";

const LATEST_PUBLISHED_POST = 4;

export const getPublishedPostsBuilding = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    select: {
      id: true,
      rootId: true,
      slug: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return posts;
};

export const getPublishedDraftPostsBuilding = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.DRAFT,
      isLatest: true,
    },
    select: {
      id: true,
      rootId: true,
      slug: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return posts;
};

export const getPublishedPostById = async (id: string) => {
  const post = await db.post.findFirst({
    where: {
      id: id,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const lastPublishedPost = { ...post };

  return lastPublishedPost;
};

export const getLatestPublishedPosts = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
      user: true,
    },
    take: LATEST_PUBLISHED_POST,
    orderBy: {
      firstPublishedAt: "desc",
    },
  });
  return posts;
};

export const createNewVersionPost = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedPost = await db.post.findFirst({
    where: {
      rootId,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      tags: true,
      postCategories: true,
      postAuthors: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedPost) {
    return { message: "Post not found", status: 404, post: null };
  }

  // Creo nuova versione
  const post = await db.post.create({
    data: {
      title: values.title || publishedPost.title,
      slug: values.slug || publishedPost.slug,
      version: publishedPost.version + 1,
      status: ContentStatus.CHANGED,
      isLatest: false,
      bodyData: [{ type: "paragraph", children: [{ text: "" }] }],
    },
  });

  const updatedPost = await db.post.update({
    where: { id: post.id },
    data: {
      ...publishedPost,
      ...values,
      id: undefined,
      version: undefined,
      status: undefined,
      isLatest: undefined,
      postCategories: undefined,
      tags: values.tags
        ? {
            set: values.tags.map((tag: { id: string }) => ({
              id: tag.id,
            })),
          }
        : publishedPost.tags.length > 0
        ? {
            set: publishedPost.tags.map((tag) => ({
              id: tag.id,
            })),
          }
        : undefined,
      postAuthors: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  const newCategories = values.categories
    ? [...values.categories]
    : [...publishedPost.postCategories];

  if (newCategories) {
    for (const category of newCategories) {
      await db.postCategory.create({
        data: {
          postId: post.id,
          categoryId: category.categoryId,
          sort: category.sort,
        },
      });
    }
  }

  const newAuthors = values.authors
    ? [...values.authors]
    : [...publishedPost.postAuthors];

  if (newAuthors) {
    for (const author of newAuthors) {
      await db.postAuthor.create({
        data: {
          postId: post.id,
          userId: author.userId,
          sort: author.sort,
        },
      });
    }
  }

  return { message: "", status: 200, post: updatedPost };
};
