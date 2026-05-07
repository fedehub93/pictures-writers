import { db } from "@/lib/db";

export const getPages = async () => {
  const pages = await db.page.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
      rootId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return pages;
};

export type GetPages = Awaited<ReturnType<typeof getPages>>[number];

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

    return page;
  } catch (error) {
    console.error("GET_LAST_PUBLISHED_PAGE_BY_ROOT_ID", error);
    return null;
  }
};

export type GetLastPageByRootId = Awaited<
  ReturnType<typeof getLastPageByRootId>
>;
