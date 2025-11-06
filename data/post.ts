import { ContentStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * GetPostsByFilter
 */

type GetPostsByFiltersParams = {
  where: Prisma.Args<typeof db.post, "findMany">["where"];
};

export const getPostsByFilters = async ({ where }: GetPostsByFiltersParams) => {
  try {
    const posts = await db.post.findMany({
      where,
      select: {
        id: true,
        rootId: true,
        title: true,
        description: true,
        slug: true,
        updatedAt: true,
        postCategories: {
          select: {
            category: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        imageCover: {
          select: {
            url: true,
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
      orderBy: {
        firstPublishedAt: "desc",
      },
    });

    return { posts };
  } catch (error) {
    return { posts: [] };
  }
};

export type GetPostsByFiltersReturn = Awaited<
  ReturnType<typeof getPostsByFilters>
>;

/**
 * GetPostsPaginatedByFilter
 */

type GetPostsPaginatedByFiltersParams = {
  page: number;
  where: Prisma.Args<typeof db.post, "findMany">["where"];
};

const POST_PER_PAGE = 10;

export const getPostsPaginatedByFilters = async ({
  page,
  where,
}: GetPostsPaginatedByFiltersParams) => {
  try {
    const skip = POST_PER_PAGE * (page - 1);

    const posts = await db.post.findMany({
      where,
      select: {
        id: true,
        rootId: true,
        title: true,
        description: true,
        slug: true,
        updatedAt: true,
        postCategories: {
          select: {
            category: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        imageCover: {
          select: {
            url: true,
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
      take: POST_PER_PAGE,
      skip: skip,
      orderBy: {
        firstPublishedAt: "desc",
      },
    });

    const totalPosts = await db.post.count({
      where,
    });

    const totalPages = Math.ceil(totalPosts / POST_PER_PAGE);

    return { posts, totalPages, currentPage: page };
  } catch (error) {
    return { posts: [], totalPages: 0, currentPage: 0 };
  }
};

export type GetPostsPaginatedByFiltersReturn = Awaited<
  ReturnType<typeof getPostsPaginatedByFilters>
>;

export const getPaginatedPosts = async ({
  cursor,
  searchString,
  page,
  postBatch,
}: {
  cursor: string | null;
  searchString: string;
  page: number;
  postBatch: number;
}) => {
  let totalPosts = 0;

  const skip = (page - 1) * postBatch;
  const take = postBatch;

  const where: Prisma.Args<typeof db.post, "findMany">["where"] = {
    status: ContentStatus.PUBLISHED,
    isLatest: true,
    OR: [
      {
        title: {
          contains: searchString,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchString,
          mode: "insensitive",
        },
      },
    ],
  };

  const posts = await db.post.findMany({
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      description: true,
      publishedAt: true,
      imageCover: {
        select: {
          id: true,
          url: true,
          altText: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
    },
    where,
    take: cursor ? postBatch : take,
    skip: cursor ? 1 : skip,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  totalPosts = await db.post.count({ where });

  const pagination = {
    page,
    perPage: postBatch,
    totalRecords: totalPosts,
    totalPages: Math.ceil(totalPosts / postBatch),
  };

  let nextCursor = null;

  if (posts.length === postBatch) {
    nextCursor = posts[postBatch - 1].id;
  }

  return {
    posts,
    pagination,
    nextCursor,
  };
};

export type GetPaginatedPosts = Awaited<ReturnType<typeof getPaginatedPosts>>;

/**
 *
 * @param ids Get Posts by ids
 * @returns
 */

export const getPostsByIds = async (ids: string[]) => {
  try {
    const posts = await db.post.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        rootId: { in: ids },
      },
      select: {
        id: true,
        rootId: true,
        title: true,
        imageCover: { select: { url: true } },
        slug: true,
      },
    });

    return posts;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export type GetPostsByIds = Awaited<ReturnType<typeof getPostsByIds>>;

/**
 *
 * @param rootId Get Published Post By Root Id
 * @returns
 */

export const getPublishedPostByRootId = async (rootId: string) => {
  const post = await db.post.findFirst({
    where: {
      rootId: rootId,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      description: true,
      slug: true,
      imageCover: {
        select: {
          id: true,
          url: true,
          altText: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return post;
};

export type GetPublishedPostByRootId = Awaited<
  ReturnType<typeof getPublishedPostByRootId>
>;

/**
 *
 * @param slug Get Published Post By Slug
 * @returns
 */

export const getPublishedPostBySlug = async (slug: string) => {
  const post = await db.post.findFirst({
    where: {
      slug,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      description: true,
      editorType: true,
      bodyData: true,
      tiptapBodyData: true,
      publishedAt: true,
      firstPublishedAt: true,
      updatedAt: true,
      seo: {
        select: {
          title: true,
          description: true,
        },
      },
      postCategories: {
        select: {
          category: {
            select: {
              rootId: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      tags: {
        select: {
          rootId: true,
          title: true,
          slug: true,
        },
        where: {
          isLatest: true,
        },
      },
      imageCover: {
        select: {
          url: true,
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
    orderBy: {
      publishedAt: "desc",
    },
  });

  return post;
};

export type GetPublishedPostBySlug = Awaited<
  ReturnType<typeof getPublishedPostBySlug>
>;

export const getPublishedDraftPostsBuilding = async () => {
  const posts = await db.post.findMany({
    where: {
      OR: [
        {
          isLatest: true,
          status: ContentStatus.DRAFT,
        },
        {
          isLatest: false,
          status: ContentStatus.CHANGED,
        },
      ],
    },
    select: {
      id: true,
      rootId: true,
      slug: true,
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return posts;
};

/**
 *
 * @param slug Get Draft Post by Slug
 * @returns
 */

export const getDraftPostBySlug = async (slug: string) => {
  const post = await db.post.findFirst({
    where: {
      slug,
      OR: [
        {
          isLatest: true,
          status: ContentStatus.DRAFT,
        },
        {
          isLatest: false,
          status: ContentStatus.CHANGED,
        },
      ],
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      description: true,
      editorType: true,
      tiptapBodyData: true,
      bodyData: true,
      publishedAt: true,
      firstPublishedAt: true,
      updatedAt: true,
      seo: {
        select: {
          title: true,
          description: true,
        },
      },
      postCategories: {
        select: {
          category: {
            select: {
              rootId: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      tags: {
        select: {
          rootId: true,
          title: true,
          slug: true,
        },
      },
      imageCover: {
        select: {
          url: true,
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
    orderBy: {
      publishedAt: "desc",
    },
  });

  return post;
};

export type GetDraftPostBySlug = Awaited<ReturnType<typeof getDraftPostBySlug>>;

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
