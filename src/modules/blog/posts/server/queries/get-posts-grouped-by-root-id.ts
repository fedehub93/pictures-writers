import { db } from "@/shared/lib/db";

export const getPostsGroupedByRootId = async () => {
  try {
    const posts = await db.post.findMany({
      select: {
        id: true,
        rootId: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        firstPublishedAt: true,
        editorType: true,
        imageCover: {
          select: {
            url: true,
            altText: true,
          },
        },
        postAuthors: {
          select: {
            user: {
              select: {
                email: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            sort: "asc",
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      distinct: ["rootId"],
    });
    return posts;
  } catch (error) {
    console.error("GET POSTS GROUPED BY ROOT_ID", error);
    return [];
  }
};

export type GetPostsGroupedByRootId = Awaited<
  ReturnType<typeof getPostsGroupedByRootId>
>[number];
