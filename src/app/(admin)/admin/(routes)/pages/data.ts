import { db } from "@/lib/db";
import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

export const getPagesGroupedByRootId = async () => {
  try {
    const pages = await db.page.findMany({
      select: {
        id: true,
        rootId: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        firstPublishedAt: true,
        editorType: true,
        createdAt: true,
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

export const getLastPageByRootId = async (rootId: string) => {
  try {
    const page = await db.page.findFirst({
      where: {
        rootId,
      },
      orderBy: {
        publishedAt: "desc",
      },
      select: {
        id: true,
        rootId: true,
        title: true,
        slug: true,
        puckData: true,
        status: true,
      },
    });

    if (!page) return null;

    const hydratedPage = {
      ...page,
      puckData: page.puckData ? await hydratePuckForms(page.puckData) : null,
    };

    return hydratedPage;
  } catch (error) {
    console.error("GET_LAST_PUBLISHED_PAGE_BY_ROOT_ID", error);
    return null;
  }
};

export type GetLastPageByRootId = Awaited<
  ReturnType<typeof getLastPageByRootId>
>;
