import { ContentStatus } from "@prisma/client";
import { db } from "./db";

export const getPublishedTagBySlug = async (slug: string) => {
  const tag = await db.tag.findFirst({
    where: { slug, isLatest: true },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  if (!tag) {
    return null;
  }

  return tag;
};

export const createNewVersionTag = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedTag = await db.tag.findFirst({
    where: { rootId, status: ContentStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedTag) {
    return { message: "Tag not found", status: 404, tag: null };
  }

  // Aggiorna la vecchia versione
  await db.tag.updateMany({
    where: { rootId: rootId },
    data: { isLatest: false },
  });

  const tag = await db.tag.create({
    data: {
      ...publishedTag,
      ...values,
      id: undefined,
      version: publishedTag.version + 1,
      status: ContentStatus.CHANGED,
      isLatest: true,
      rootId: undefined,
      root: {
        connect: { id: publishedTag.rootId },
      },
      seoId: undefined,
      seo: {
        connect: { id: publishedTag.seoId },
      },
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  return { message: "", status: 200, tag };
};
