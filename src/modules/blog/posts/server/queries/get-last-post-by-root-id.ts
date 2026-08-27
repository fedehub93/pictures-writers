import { db } from "@/shared/lib/db";

/**
 *
 * @param rootId Get Last Post By Root Id
 * @returns
 */

export const getLastPostByRootId = async (rootId: string) => {
  try {
    const post = await db.post.findFirst({
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
        description: true,
        status: true,
        editorType: true,
        bodyData: true,
        tiptapBodyData: true,
        publishedAt: true,
        firstPublishedAt: true,
        updatedAt: true,
        seo: true,
        postCategories: {
          select: {
            category: {
              select: {
                id: true,
                rootId: true,
                title: true,
                slug: true,
                status: true,
              },
            },
            sort: true,
          },
        },
        tags: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
          where: {
            isLatest: true,
          },
        },
        imageCover: {
          select: {
            url: true,
            name: true,
            altText: true,
          },
        },
        postAuthors: {
          select: {
            user: true,
            sort: true,
          },
          orderBy: {
            sort: "asc",
          },
        },
      },
    });

    return post;
  } catch (error) {
    console.error("GET LAST PUBLISHED POST BY ROOT_ID", error);
    return null;
  }
};

export type GetLastPostByRootId = Awaited<
  ReturnType<typeof getLastPostByRootId>
>;
