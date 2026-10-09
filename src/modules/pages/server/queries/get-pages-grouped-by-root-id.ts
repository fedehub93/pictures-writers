import { db } from "@/shared/lib/db";

export const getPagesGroupedByRootId = async () => {
  try {
    const roots = await db.pageRoot.findMany({
      include: {
        currentVersion: {
          select: {
            id: true,
            title: true,
            status: true,
            publishedAt: true,
          },
        },
      },
      orderBy: {
        firstPublishedAt: "desc",
      },
    });

    return roots
      .filter((root) => root.currentVersion !== null)
      .map((root) => ({
        id: root.currentVersion!.id,
        rootId: root.id,
        title: root.currentVersion!.title,
        slug: root.slug,
        status: root.currentVersion!.status,
        publishedAt: root.currentVersion!.publishedAt,
        firstPublishedAt: root.firstPublishedAt,
      }));
  } catch (error) {
    console.error("GET_PAGES_GROUPED_BY_ROOT_ID", error);
    return [];
  }
};

export type GetPagesGroupedByRootId = Awaited<
  ReturnType<typeof getPagesGroupedByRootId>
>[number];
