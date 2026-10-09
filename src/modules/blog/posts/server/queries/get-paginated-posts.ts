import { Prisma } from "@/generated/prisma";

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

  const where: Prisma.PostRootWhereInput = {
    liveVersion: {
      is: {
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
      },
    },
  };

  const roots = await db.postRoot.findMany({
    where,
    take: postBatch,
    skip: cursor ? 1 : skip,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      firstPublishedAt: "desc",
    },
    include: {
      liveVersion: {
        include: {
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
      },
    },
  });

  const posts = roots
    .filter((root) => Boolean(root.liveVersion))
    .map((root) => {
      const version = root.liveVersion!;

      return {
        id: version.id,
        rootId: root.id,
        title: version.title,
        slug: root.slug,
        description: version.description,
        publishedAt: version.publishedAt,
        imageCover: version.imageCover,
        user: version.user,
      };
    });

  totalPosts = await db.postRoot.count({ where });

  const pagination = {
    page,
    perPage: postBatch,
    totalRecords: totalPosts,
    totalPages: Math.ceil(totalPosts / postBatch),
  };

  let nextCursor = null;

  if (roots.length === postBatch) {
    nextCursor = roots[postBatch - 1].id;
  }

  return {
    posts,
    pagination,
    nextCursor,
  };
};

export type GetPaginatedPosts = Awaited<ReturnType<typeof getPaginatedPosts>>;
