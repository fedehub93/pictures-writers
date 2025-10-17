import { db } from "@/lib/db";

type GetAdBlocksParams = {
  postRootId: string;
  categoryRootIds: string[];
  tagRootIds: string[];
};
export const getAdBlocks = async ({
  postRootId,
  categoryRootIds,
  tagRootIds,
}: GetAdBlocksParams) => {
  const blocks = await db.adBlock.findMany({
    where: {
      campaign: {
        isActive: true,
      },
      isActive: true,
      NOT: {
        OR: [
          { excludedPostIds: { has: postRootId } },
          {
            excludedCategoryIds: {
              hasSome: categoryRootIds,
            },
          },
          {
            excludedTagIds: {
              hasSome: tagRootIds,
            },
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });

  return blocks;
};

export type GetAdBlocks = Awaited<ReturnType<typeof getAdBlocks>>[number];
