import { db } from "@/shared/lib/db";

import { ContentStatus } from "@/generated/prisma";

import type { CategoryUpdateValues } from "../schemas";

export const createNewVersion = async (
  input: Partial<CategoryUpdateValues>,
) => {
  const latestCategory = await db.category.findFirst({
    where: {
      rootId: input.rootId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestCategory) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  let categoryToUpdate = latestCategory;

  if (latestCategory.status === ContentStatus.PUBLISHED) {
    categoryToUpdate = await db.category.create({
      data: {
        title: input.title || latestCategory.title,
        slug: input.slug || latestCategory.slug,
        version: latestCategory.version + 1,
        status: ContentStatus.CHANGED,
        isLatest: false,
      },
    });
  }

  return await db.category.update({
    where: { id: categoryToUpdate.id },
    data: {
      ...latestCategory,
      ...input,
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
