import { Category, Media, PostVersion, Tag } from "@prisma/client";
import { db } from "./db";

const POST_PER_PAGE = 10;

export type PostVersionWithImageCoverWithCategoryWithTags = PostVersion & {
  imageCover: Media | null;
  category: Category | null;
  tags: Tag[];
};

type GetPublishedPosts = {
  page: number;
};

export const getPublishedPosts = async ({ page }: GetPublishedPosts) => {
  const skip = POST_PER_PAGE * (page - 1);

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
