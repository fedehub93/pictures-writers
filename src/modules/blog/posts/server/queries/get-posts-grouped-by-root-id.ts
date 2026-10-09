import { db } from "@/shared/lib/db";

export const getPostsGroupedByRootId = async () => {
  try {
    const roots = await db.postRoot.findMany({
      include: {
        currentVersion: {
          select: {
            id: true,
            title: true,
            status: true,
            publishedAt: true,
            imageCover: {
              select: {
                url: true,
                altText: true,
              },
            },
            authors: {
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
        },
      },
      orderBy: {
        firstPublishedAt: "desc",
      },
    });

    return roots
      .filter((root) => Boolean(root.currentVersion))
      .map((root) => {
        const version = root.currentVersion!;

        return {
          id: version.id,
          rootId: root.id,
          title: version.title,
          slug: root.slug,
          status: version.status,
          publishedAt: version.publishedAt,
          firstPublishedAt: root.firstPublishedAt,
          imageCover: version.imageCover,
          authors: version.authors,
        };
      });
  } catch (error) {
    console.error("GET POSTS GROUPED BY ROOT_ID", error);
    return [];
  }
};

export type GetPostsGroupedByRootId = Awaited<
  ReturnType<typeof getPostsGroupedByRootId>
>[number];
