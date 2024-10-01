import {
  Category,
  ContentStatus,
  Media,
  Post,
  Tag,
  User,
} from "@prisma/client";
import { db } from "./db";

const POST_PER_PAGE = 10;
const LATEST_PUBLISHED_POST = 4;

export type PostWithImageCoverWithCategoryWithTags = Post & {
  imageCover: Media | null;
  category: Category | null;
  tags: Tag[];
  user: User | null;
};

type GetPublishedPosts = {
  page: number;
  s?: string;
};

type GetPublishedPostsByCategoryId = {
  categoryRootId: string;
  page: number;
};

type GetPublishedPostsByTagId = {
  tagRootId: string;
  page: number;
};

export const getPublishedPosts = async ({
  page,
  s = "",
}: GetPublishedPosts) => {
  const skip = POST_PER_PAGE * (page - 1);

  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      OR: [
        {
          title: { contains: s },
        },
        {
          description: { contains: s },
        },
      ],
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      user: true,
    },
    take: POST_PER_PAGE,
    skip: skip,
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const totalPosts = await db.post.count({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
  });

  const totalPages = Math.ceil(totalPosts / POST_PER_PAGE);

  return { posts, totalPages, currentPage: page };
};

export const getPublishedPostsBuilding = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      user: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return posts;
};

export const getPublishedPostsByCategoryRootId = async ({
  categoryRootId,
  page,
}: GetPublishedPostsByCategoryId) => {
  const skip = POST_PER_PAGE * (page - 1);

  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      category: { rootId: { equals: categoryRootId } },
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      user: true,
    },
    take: POST_PER_PAGE,
    skip: skip,
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const totalPages = Math.ceil(posts.length / POST_PER_PAGE);

  return { posts, totalPages, currentPage: page };
};

export const getPublishedPostsByTagRootId = async ({
  tagRootId,
  page,
}: GetPublishedPostsByTagId) => {
  const skip = POST_PER_PAGE * (page - 1);

  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      tags: {
        some: { rootId: { equals: tagRootId } },
      },
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      user: true,
    },
    take: POST_PER_PAGE,
    skip: skip,
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const totalPages = Math.ceil(posts.length / POST_PER_PAGE);

  return { posts, totalPages, currentPage: page };
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

export const getPublishedPostBySlug = async (slug: string) => {
  const post = await db.post.findFirst({
    where: {
      slug,
      isLatest: true,
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      seo: true,
      user: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return post;
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
      createdAt: "desc",
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
    },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedPost) {
    return { message: "Post not found", status: 404, post: null };
  }

  // Aggiorna la vecchia versione
  await db.post.updateMany({
    where: { rootId: rootId },
    data: { isLatest: false },
  });

  // Creo nuova versione
  const post = await db.post.create({
    data: {
      title: values.title || publishedPost.title,
      slug: values.slug || publishedPost.slug,
      version: publishedPost.version + 1,
      status: ContentStatus.CHANGED,
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
      tags: values.tags
        ? {
            set: values.tags.map((tagId: { label: string; value: string }) => ({
              id: tagId.value,
            })),
          }
        : publishedPost.tags.length > 0
        ? {
            set: publishedPost.tags.map((tag) => ({
              id: tag.id,
            })),
          }
        : undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  return { message: "", status: 200, post: updatedPost };
};
