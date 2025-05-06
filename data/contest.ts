import { ContentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { getSelectedOrDefaultWhere } from "./language";

export const getPublishedContestByRootId = async (
  rootId: string,
  langId: string | null
) => {
  const contest = await db.contest.findFirst({
    where: {
      rootId,
      ...getSelectedOrDefaultWhere,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return contest;
};
