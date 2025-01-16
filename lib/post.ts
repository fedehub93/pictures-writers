import {
  Category,
  ContentStatus,
  Media,
  Post,
  PostAuthor,
  Seo,
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
  postAuthors: {
    user: User;
    sort: number;
  }[];
};

export type PostWithImageCoverWithCategoryWithTagsWithSeo = Post & {
  imageCover: Media | null;
  category: Category | null;
  tags: Tag[];
  seo: Seo | null;
  user: User | null;
  postAuthors: {
    user: User;
    sort: number;
  }[];
};

type GetPublishedPosts = {
  page: number;
  s?: string;
};

type GetPublishedPostsByCategoryId = {
  categoryRootId: string;
};

type GetPublishedPostsByTagId = {
  tagRootId: string;
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
      postAuthors: {
        select: {
          user: true,
          sort: true,
        },
        orderBy: {
          sort: "asc",
        },
      },
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

export const getPublishedPostsBuilding = async (): Promise<
  PostWithImageCoverWithCategoryWithTags[]
> => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      seo: true,
      user: true,
      postAuthors: {
        select: {
          user: true,
          sort: true,
        },
        orderBy: {
          sort: "asc",
        },
      },
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return posts;
};

export const getPublishedPostsByCategoryRootId = async ({
  categoryRootId,
}: GetPublishedPostsByCategoryId) => {
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
      postAuthors: {
        select: {
          user: true,
          sort: true,
        },
        orderBy: {
          sort: "asc",
        },
      },
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  const totalPosts = await db.post.count({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      category: { rootId: { equals: categoryRootId } },
    },
  });

  return { posts };
};

export const getPublishedPostsByTagRootId = async ({
  tagRootId,
}: GetPublishedPostsByTagId) => {
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
      postAuthors: {
        select: {
          user: true,
          sort: true,
        },
        orderBy: {
          sort: "asc",
        },
      },
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return { posts };
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
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      seo: true,
      user: true,
      postAuthors: {
        select: {
          user: true,
          sort: true,
        },
        orderBy: {
          sort: "asc",
        },
      },
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
      authors: undefined,
      postAuthors: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  if (values.postAuthors) {
    for (const author of values.postAuthors) {
      await db.postAuthor.create({
        data: {
          postId: post.id,
          userId: author.id,
          sort: author.sort,
        },
      });
    }
  } else {
    for (const postAuthor of publishedPost.postAuthors) {
      await db.postAuthor.create({
        data: {
          postId: post.id,
          userId: postAuthor.userId,
          sort: postAuthor.sort,
        },
      });
    }
  }

  return { message: "", status: 200, post: updatedPost };
};
