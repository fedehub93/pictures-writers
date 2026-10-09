import { db } from "@/shared/lib/db";

export const getPublishedProductByRootId = async (rootId: string) => {
  const root = await db.productRoot.findUnique({
    where: {
      id: rootId,
    },
    include: {
      liveVersion: {
        include: {
          imageCover: true,
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
    rootId: root.id,
    slug: root.slug,
    type: root.type,
  };
};

export type GetPublishedProductByRootId = Awaited<
  ReturnType<typeof getPublishedProductByRootId>
>;
