import { ContentStatus } from "@/generated/prisma";

import { db } from "@/shared/lib/db";
import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

export const getPublishedPagesBuilding = async () => {
  const pages = await db.page.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
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

export const createNewVersionPage = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedPage = await db.page.findFirst({
    where: {
      rootId,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedPage) {
    return { message: "Page not found", status: 404, page: null };
  }

  // Creo nuova versione
  const page = await db.page.create({
    data: {
      title: values.title || publishedPage.title,
      slug: values.slug || publishedPage.slug,
      version: publishedPage.version + 1,
      status: ContentStatus.CHANGED,
      isLatest: false,
    },
  });

  const updatePage = await db.page.update({
    where: { id: page.id },
    data: {
      ...publishedPage,
      ...values,
      id: undefined,
      version: undefined,
      status: undefined,
      isLatest: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  return { message: "", status: 200, page: updatePage };
};
