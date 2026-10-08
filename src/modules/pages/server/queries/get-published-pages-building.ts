import { db } from "@/shared/lib/db";

export const getPublishedPagesBuilding = async () => {
  const roots = await db.pageRoot.findMany({
    where: {
      liveVersion: { isNot: null },
    },
    select: {
      id: true,
      slug: true,
      liveVersion: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return roots.map((root) => ({
    id: root.liveVersion!.id,
    rootId: root.id,
    slug: root.slug,
  }));
};
