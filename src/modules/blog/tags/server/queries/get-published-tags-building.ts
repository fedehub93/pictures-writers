import { db } from "@/shared/lib/db";

export const getPublishedTagsBuilding = async () => {
  const tags = await db.tag.findMany({
    include: {
      seo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tags;
};
