import { db } from "@/shared/lib/db";

import { ContentStatus } from "@/generated/prisma";
import { dehydratePuckForms } from "@/puck/utils/dehydrate-puck-forms";

import type { PageUpdateValues } from "../schemas";
import { INITIAL_PUCK_DATA } from "../constants";

export const createNewVersion = async (input: Partial<PageUpdateValues>) => {
  const publishedPage = await db.page.findFirst({
    where: {
      rootId: input.rootId,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedPage) {
    throw new Error("PAGE_NOT_FOUND");
  }

  const dehydratedPuckData = input.puckData
    ? dehydratePuckForms(input.puckData)
    : publishedPage.puckData
      ? publishedPage.puckData
      : INITIAL_PUCK_DATA;

  let pageToUpdate = publishedPage;

  if (publishedPage.status === ContentStatus.PUBLISHED) {
    pageToUpdate = await db.page.create({
      data: {
        title: input.title || publishedPage.title,
        slug: input.slug || publishedPage.slug,
        version: publishedPage.version + 1,
        status: ContentStatus.CHANGED,
        isLatest: false,
      },
    });
  }

  return await db.page.update({
    where: { id: pageToUpdate.id },
    data: {
      ...publishedPage,
      ...input,
      puckData: dehydratedPuckData,
      id: undefined,
      version: undefined,
      status: undefined,
      isLatest: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });
};
