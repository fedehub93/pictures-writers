/**
 * GetPaginatedPostsByFilter
 */

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { postVersionListInclude } from "./post-list-include";

export type PostListVersion = "live" | "current";

type GetPaginatedPostsByFiltersParams = {
  page: number;
  version?: PostListVersion;
  where?: Prisma.PostVersionWhereInput;
};

const POST_PER_PAGE = 10;

export const getPaginatedPostsByFilters = async ({
  page,
  version = "live",
  where = {},
}: GetPaginatedPostsByFiltersParams) => {
  try {
    const skip = POST_PER_PAGE * (page - 1);

    const rootWhere: Prisma.PostRootWhereInput =
      version === "live"
        ? { liveVersion: { is: where } }
        : { currentVersion: { is: where } };

    const roots = await db.postRoot.findMany({
      where: rootWhere,
      include: {
        liveVersion: { include: postVersionListInclude },
        currentVersion: { include: postVersionListInclude },
      },
      take: POST_PER_PAGE,
      skip,
      orderBy: {
        firstPublishedAt: "desc",
      },
    });

    const totalPosts = await db.postRoot.count({ where: rootWhere });

    const totalPages = Math.ceil(totalPosts / POST_PER_PAGE);

    const posts = roots
      .map((root) => {
        const v = version === "live" ? root.liveVersion : root.currentVersion;
        if (!v) return null;

        return {
          id: v.id,
          rootId: root.id,
          title: v.title,
          slug: root.slug,
          description: v.description,
          updatedAt: v.updatedAt,
          publishedAt: v.publishedAt,
          imageCover: v.imageCover,
          categories: v.categories,
          authors: v.authors,
        };
      })
      .filter((post): post is NonNullable<typeof post> => post !== null);

    return { posts, totalPages, currentPage: page };
  } catch (error) {
    return { posts: [], totalPages: 0, currentPage: 0 };
  }
};

export type GetPaginatedPostsByFiltersReturn = Awaited<
  ReturnType<typeof getPaginatedPostsByFilters>
>;
