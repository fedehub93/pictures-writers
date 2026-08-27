import { ContentStatus, Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPaginatedPosts = async ({
  cursor,
  searchString,
  page,
  postBatch,
}: {
  cursor: string | null;
  searchString: string;
  page: number;
  postBatch: number;
}) => {
  let totalPosts = 0;

  const skip = (page - 1) * postBatch;
  const take = postBatch;

  const where: Prisma.Args<typeof db.post, "findMany">["where"] = {
    status: ContentStatus.PUBLISHED,
    isLatest: true,
    OR: [
      {
        title: {
          contains: searchString,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchString,
          mode: "insensitive",
        },
      },
    ],
  };

  const posts = await db.post.findMany({
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      description: true,
      publishedAt: true,
      imageCover: {
        select: {
          id: true,
          url: true,
          altText: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
    },
    where,
    take: cursor ? postBatch : take,
    skip: cursor ? 1 : skip,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  totalPosts = await db.post.count({ where });

  const pagination = {
    page,
    perPage: postBatch,
    totalRecords: totalPosts,
    totalPages: Math.ceil(totalPosts / postBatch),
  };

  let nextCursor = null;

  if (posts.length === postBatch) {
    nextCursor = posts[postBatch - 1].id;
  }

  return {
    posts,
    pagination,
    nextCursor,
  };
};

export type GetPaginatedPosts = Awaited<ReturnType<typeof getPaginatedPosts>>;
