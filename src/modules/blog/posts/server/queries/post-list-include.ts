import { Prisma } from "@/generated/prisma";

/**
 * Shared select used by the public/admin list queries so every list row exposes
 * the same version-owned relations (image, taxonomy, authors).
 */
export const postVersionListInclude = {
  imageCover: true,
  categories: {
    select: {
      category: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  },
  authors: {
    select: {
      user: true,
      sort: true,
    },
    orderBy: {
      sort: "asc",
    },
  },
} satisfies Prisma.PostVersionInclude;
