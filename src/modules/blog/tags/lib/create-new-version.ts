import { db } from "@/shared/lib/db";

import { ContentStatus } from "@/generated/prisma";

import type { TagUpdateValues } from "../schemas";

export const createNewVersion = async (input: Partial<TagUpdateValues>) => {
  const latestTag = await db.tag.findFirst({
    where: {
      rootId: input.rootId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestTag) {
    throw new Error("TAG_NOT_FOUND");
  }

  let tagToUpdate = latestTag;

  if (latestTag.status === ContentStatus.PUBLISHED) {
    tagToUpdate = await db.tag.create({
      data: {
        title: input.title || latestTag.title,
        slug: input.slug || latestTag.slug,
        version: latestTag.version + 1,
        status: ContentStatus.CHANGED,
        isLatest: false,
      },
    });
  }

  return await db.tag.update({
    where: { id: tagToUpdate.id },
    data: {
      ...latestTag,
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
