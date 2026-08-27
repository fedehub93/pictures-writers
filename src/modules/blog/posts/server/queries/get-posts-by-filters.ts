import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

/**
 * GetPostsByFilter
 */

type GetPostsByFiltersParams = {
  where: Prisma.Args<typeof db.post, "findMany">["where"];
};

export const getPostsByFilters = async ({ where }: GetPostsByFiltersParams) => {
  try {
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
      orderBy: {
        firstPublishedAt: "desc",
      },
    });

    return { posts };
  } catch (error) {
    return { posts: [] };
  }
};

export type GetPostsByFiltersReturn = Awaited<
  ReturnType<typeof getPostsByFilters>
>;
