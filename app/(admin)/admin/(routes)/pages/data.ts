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
