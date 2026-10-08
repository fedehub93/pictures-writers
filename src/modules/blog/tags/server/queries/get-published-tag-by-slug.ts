import { db } from "@/shared/lib/db";

export const getPublishedTagBySlug = async (slug: string) => {
  const tag = await db.tag.findUnique({
    where: { slug },
  });

  if (!tag) {
    return null;
  }

  return tag;
};
