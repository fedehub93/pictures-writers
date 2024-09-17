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
  user: User;
};

type GetPublishedPosts = {
  page: number;
  s?: string;
};

export const getPublishedPosts = async ({
  page,
  s = "",
}: GetPublishedPosts) => {
  const skip = POST_PER_PAGE * (page - 1);

  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
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
      user: true,
    },
    distinct: ["rootId"],
    take: POST_PER_PAGE,
    skip: skip,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalPages = Math.ceil(posts.length / POST_PER_PAGE);

  const lastPublishedPosts = posts.map((post) => {
    const lastPublishedPost = { ...post };
    return lastPublishedPost;
  });

  return { posts: lastPublishedPosts, totalPages, currentPage: page };
};

export const getPublishedPostById = async (id: string) => {
  const post = await db.post.findFirst({
    where: {
      id: id,
      status: ContentStatus.PUBLISHED,
    },
    include: {
      user: true,
    },
    distinct: ["rootId"],
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
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
    },
    distinct: ["rootId"],
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
    },
    include: {
      imageCover: true,
      user: true,
    },
    distinct: ["rootId"],
    take: LATEST_PUBLISHED_POST,
    orderBy: {
      createdAt: "desc",
    },
  });
  console.log(posts);
  return posts;
};

export const createNewVersionPost = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedPost = await db.post.findFirst({
    where: { rootId, status: ContentStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedPost) {
    return { message: "Post not found", status: 404, post: null };
  }

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
      tags: values.tags
        ? {
            set: values.tags.map((tagId: { label: string; value: string }) => ({
              id: tagId.value,
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
