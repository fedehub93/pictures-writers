import { db } from "@/shared/lib/db";

export const getPublishedPostById = async (id: string) => {
  const root = await db.postRoot.findFirst({
    where: {
      liveVersionId: id,
    },
    include: {
      liveVersion: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!root || !root.liveVersion) return null;

  return {
    ...root.liveVersion,
    rootId: root.id,
    slug: root.slug,
    firstPublishedAt: root.firstPublishedAt,
  };
};
