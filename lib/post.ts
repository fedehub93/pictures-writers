import { Category, Media, PostVersion, Tag } from "@prisma/client";
import { db } from "./db";

const POST_PER_PAGE = 10;
const LATEST_PUBLISHED_POST = 4;

export type PostVersionWithImageCoverWithCategoryWithTags = PostVersion & {
  imageCover: Media | null;
  category: Category | null;
  tags: Tag[];
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
      isPublished: true,
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
      versions: {
        include: {
          imageCover: true,
          category: true,
          tags: true,
        },
        take: 1,
        orderBy: {
          publishedAt: "desc",
        },
      },
    },
    take: POST_PER_PAGE,
    skip: skip,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalPages = Math.ceil(posts.length / POST_PER_PAGE);

  const lastPublishedPosts = posts.map((post) => {
    const lastPublishedPost = post.versions[0];
    return lastPublishedPost;
  });

  return { posts: lastPublishedPosts, totalPages, currentPage: page };
};

export const getLatestPublishedPosts = async () => {
  const posts = await db.post.findMany({
    where: {
      isPublished: true,
    },
    include: {
      versions: {
        include: {
          imageCover: true,
          category: true,
          tags: true,
        },
        take: 1,
        orderBy: {
          publishedAt: "desc",
        },
      },
    },
    take: LATEST_PUBLISHED_POST,
    orderBy: {
      createdAt: "desc",
    },
  });

  const latestPublishedPosts = posts.map((post) => {
    const lastPublishedPost = post.versions[0];
    return lastPublishedPost;
  });

  return latestPublishedPosts;
};
