import { db } from "@/shared/lib/db";

export const getPagesGroupedByRootId = async () => {
  try {
    const pages = await db.post.findMany({
      select: {
        id: true,
        rootId: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        firstPublishedAt: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      distinct: ["rootId"],
    });
    return pages;
  } catch (error) {
    console.error("GET_PAGES_GROUPED_BY_ROOT_ID", error);
    return [];
  }
};

export type GetPagesGroupedByRootId = Awaited<
  ReturnType<typeof getPagesGroupedByRootId>
>[number];
