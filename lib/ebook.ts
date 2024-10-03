import { ContentStatus } from "@prisma/client";
import { db } from "./db";

export const createNewVersionEbook = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedEbook = await db.ebook.findFirst({
    where: { rootId, status: ContentStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedEbook) {
    return { message: "Ebook not found", status: 404, ebook: null };
  }

  // Aggiorna la vecchia versione
  await db.ebook.updateMany({
    where: { rootId: rootId },
    data: { isLatest: false },
  });

  const ebook = await db.ebook.create({
    data: {
      title: values.title || publishedEbook.title,
      version: publishedEbook.version + 1,
      status: ContentStatus.CHANGED,
    },
  });

  const updatedEbook = await db.ebook.update({
    where: { id: ebook.id },
    data: {
      ...publishedEbook,
      ...values,
      id: undefined,
      version: undefined,
      status: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  return { message: "", status: 200, post: updatedEbook };
};
