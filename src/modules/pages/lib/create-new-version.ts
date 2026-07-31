import { db } from "@/shared/lib/db";

import { ContentStatus } from "@/generated/prisma";
import { dehydratePuckForms } from "@/puck/utils/dehydrate-puck-forms";

import type { PageUpdateValues } from "../schemas";
import { INITIAL_PUCK_DATA } from "../constants";

export const createNewVersion = async (input: Partial<PageUpdateValues>) => {
  const latestPage = await db.page.findFirst({
    where: {
      rootId: input.rootId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestPage) {
    throw new Error("PAGE_NOT_FOUND");
  }

  const dehydratedPuckData = input.puckData
    ? dehydratePuckForms(input.puckData)
    : latestPage.puckData
      ? latestPage.puckData
      : INITIAL_PUCK_DATA;

  let pageToUpdate = latestPage;

  if (latestPage.status === ContentStatus.PUBLISHED) {
    pageToUpdate = await db.page.create({
      data: {
        title: input.title || latestPage.title,
        slug: input.slug || latestPage.slug,
        version: latestPage.version + 1,
        status: ContentStatus.CHANGED,
        isLatest: false,
      },
    });
  }

  return await db.page.update({
    where: { id: pageToUpdate.id },
    data: {
      ...latestPage,
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
