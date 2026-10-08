/**
 *
 * @param rootId Get Published Post By Root Id
 * @returns
 */

import { db } from "@/shared/lib/db";

export const getPublishedPostByRootId = async (rootId: string) => {
  const root = await db.postRoot.findUnique({
    where: {
      id: rootId,
    },
    include: {
      liveVersion: {
        select: {
          id: true,
          title: true,
          description: true,
          imageCover: {
            select: {
              id: true,
              url: true,
              altText: true,
            },
          },
        },
      },
    },
  });

  if (!root || !root.liveVersion) return null;

  return {
    id: root.liveVersion.id,
    rootId: root.id,
    title: root.liveVersion.title,
    description: root.liveVersion.description,
    slug: root.slug,
    imageCover: root.liveVersion.imageCover,
  };
};

export type GetPublishedPostByRootId = Awaited<
  ReturnType<typeof getPublishedPostByRootId>
>;
