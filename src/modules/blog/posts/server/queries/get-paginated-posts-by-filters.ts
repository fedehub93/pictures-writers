/**
 * GetPaginatedPostsByFilter
 */

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

type GetPaginatedPostsByFiltersParams = {
  page: number;
  where: Prisma.Args<typeof db.post, "findMany">["where"];
};

const POST_PER_PAGE = 10;

export const getPaginatedPostsByFilters = async ({
  page,
  where,
}: GetPaginatedPostsByFiltersParams) => {
  try {
    const skip = POST_PER_PAGE * (page - 1);

    const posts = await db.post.findMany({
      where,
      select: {
        id: true,
        rootId: true,
        title: true,
        description: true,
        slug: true,
        updatedAt: true,
        postCategories: {
          select: {
            category: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        imageCover: {
          select: {
            url: true,
            altText: true,
          },
        },
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
      where,
    });

    const totalPages = Math.ceil(totalPosts / POST_PER_PAGE);

    return { posts, totalPages, currentPage: page };
  } catch (error) {
    return { posts: [], totalPages: 0, currentPage: 0 };
  }
};

export type GetPaginatedPostsByFiltersReturn = Awaited<
  ReturnType<typeof getPaginatedPostsByFilters>
>;