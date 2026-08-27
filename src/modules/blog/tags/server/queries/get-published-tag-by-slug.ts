import { db } from "@/shared/lib/db";

export const getPublishedTagBySlug = async (slug: string) => {
  const tag = await db.tag.findFirst({
    where: { slug, isLatest: true },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  if (!tag) {
    return null;
  }

  return tag;
};
