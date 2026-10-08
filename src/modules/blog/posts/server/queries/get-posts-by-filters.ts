import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { postVersionListInclude } from "./post-list-include";
import type { PostListVersion } from "./get-paginated-posts-by-filters";

/**
 * GetPostsByFilter
 */

type GetPostsByFiltersParams = {
  version?: PostListVersion;
  where?: Prisma.PostVersionWhereInput;
};

export const getPostsByFilters = async ({
  version = "live",
  where = {},
}: GetPostsByFiltersParams) => {
  try {
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
      orderBy: {
        firstPublishedAt: "desc",
      },
    });

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

    return { posts };
  } catch (error) {
    return { posts: [] };
  }
};

export type GetPostsByFiltersReturn = Awaited<
  ReturnType<typeof getPostsByFilters>
>;
