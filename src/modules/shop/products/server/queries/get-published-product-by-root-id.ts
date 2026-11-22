import { db } from "@/shared/lib/db";
import {
  mediaPresentationSelect,
  withMediaUrl,
} from "@/modules/media/lib/media-address";

export const getPublishedProductByRootId = async (rootId: string) => {
  const root = await db.productRoot.findUnique({
    where: {
      id: rootId,
    },
    include: {
      liveVersion: {
        include: {
          imageCover: { select: { ...mediaPresentationSelect } },
          seo: true,
          user: true,
        },
      },
    },
  });

  if (!root || !root.liveVersion) {
    return null;
  }

  return {
    ...root.liveVersion,
    imageCover: root.liveVersion.imageCover
      ? withMediaUrl(root.liveVersion.imageCover)
      : null,
    rootId: root.id,
    slug: root.slug,
    type: root.type,
  };
};

export type GetPublishedProductByRootId = Awaited<
  ReturnType<typeof getPublishedProductByRootId>
>;
