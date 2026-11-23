/**
 *
 * @param rootId Get Published Post By Root Id
 * @returns
 */

import { db } from "@/shared/lib/db";
import {
  mediaAddressSelect,
  withMediaUrl,
} from "@/modules/media/lib/media-address";

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
            select: { ...mediaAddressSelect, id: true, altText: true },
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
    imageCover: root.liveVersion.imageCover
      ? withMediaUrl(root.liveVersion.imageCover)
      : null,
  };
};

export type GetPublishedPostByRootId = Awaited<
  ReturnType<typeof getPublishedPostByRootId>
>;
