import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

/**
 *
 * @param slug Get Published Page By Slug
 * @returns
 */

export const getPublishedPageBySlug = async (slug: string) => {
  const page = await db.page.findFirst({
    where: {
      slug,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      editorType: true,
      puckData: true,
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

  if (!page) return null;

  const hydratedPage = {
    ...page,
    puckData: page.puckData ? await hydratePuckForms(page.puckData) : null,
  };

  return hydratedPage;
};

export type GetPublishedPageBySlug = Awaited<
  ReturnType<typeof getPublishedPageBySlug>
>;
