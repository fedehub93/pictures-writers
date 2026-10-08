import { db } from "@/shared/lib/db";

/**
 *
 * @param ids Get Posts by ids
 * @returns
 */

export const getPostsByIds = async (ids: string[]) => {
  try {
    const roots = await db.postRoot.findMany({
      where: {
        id: { in: ids },
        liveVersion: { isNot: null },
      },
      include: {
        liveVersion: {
          select: {
            id: true,
            title: true,
            imageCover: { select: { url: true } },
          },
        },
      },
    });

    return roots.map((root) => ({
      id: root.liveVersion!.id,
      rootId: root.id,
      title: root.liveVersion!.title,
      imageCover: root.liveVersion!.imageCover,
      slug: root.slug,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};
