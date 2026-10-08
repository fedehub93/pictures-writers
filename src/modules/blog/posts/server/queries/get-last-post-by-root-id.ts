import { db } from "@/shared/lib/db";

/**
 *
 * @param rootId Get Last Post By Root Id
 * @returns
 */

export const getLastPostByRootId = async (rootId: string) => {
  try {
    const root = await db.postRoot.findUnique({
      where: {
        id: rootId,
      },
      include: {
        currentVersion: {
          include: {
            seo: true,
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
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
              },
            },
            imageCover: {
              select: {
                url: true,
                name: true,
                altText: true,
              },
            },
            authors: {
              select: {
                user: true,
                sort: true,
              },
              orderBy: {
                sort: "asc",
              },
            },
          },
        },
      },
    });

    if (!root || !root.currentVersion) return null;

    const version = root.currentVersion;

    return {
      id: version.id,
      rootId: root.id,
      title: version.title,
      slug: root.slug,
      description: version.description,
      status: version.status,
      tiptapBodyData: version.tiptapBodyData,
      publishedAt: version.publishedAt,
      firstPublishedAt: root.firstPublishedAt,
      updatedAt: version.updatedAt,
      version: version.version,
      seo: version.seo,
      categories: version.categories,
      tags: version.tags,
      imageCover: version.imageCover,
      authors: version.authors,
    };
  } catch (error) {
    console.error("GET LAST PUBLISHED POST BY ROOT_ID", error);
    return null;
  }
};

export type GetLastPostByRootId = Awaited<
  ReturnType<typeof getLastPostByRootId>
>;
