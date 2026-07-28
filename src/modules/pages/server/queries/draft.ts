import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export const getPublishedDraftPagesBuilding = async () => {
  const pages = await db.page.findMany({
    where: {
      OR: [
        {
          isLatest: true,
          status: ContentStatus.DRAFT,
        },
        {
          isLatest: false,
          status: ContentStatus.CHANGED,
        },
      ],
    },
    select: {
      id: true,
      rootId: true,
      slug: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return pages;
};

export const getDraftPageBySlug = async (slug: string) => {
  const page = await db.page.findFirst({
    where: {
      slug,
      OR: [
        {
          isLatest: true,
          status: ContentStatus.DRAFT,
        },
        {
          isLatest: false,
          status: ContentStatus.CHANGED,
        },
      ],
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      puckData: true,
      publishedAt: true,
      firstPublishedAt: true,
      updatedAt: true,
      seo: {
        select: {
          title: true,
          description: true,
        },
      },
    },

    orderBy: {
      publishedAt: "desc",
    },
  });

  return page;
};

export type GetDraftPageBySlug = Awaited<ReturnType<typeof getDraftPageBySlug>>;
