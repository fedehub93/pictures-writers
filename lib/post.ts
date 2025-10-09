import { ContentStatus, EditorType, Media, Tag, User } from "@prisma/client";
import { db } from "./db";

const POST_PER_PAGE = 10;
const LATEST_PUBLISHED_POST = 4;

export type PostWithImageCoverWithCategory = {
  id: string;
  rootId: string | null;
  title: string;
  slug: string;
  description: string | null;
  imageCover: {
    url: string;
    altText: string | null;
  } | null;
  postCategories: {
    category: {
      rootId: string | null;
      title: string;
      slug: string;
    };
  }[];
  postAuthors: {
    user: User;
    sort: number;
  }[];
  updatedAt: Date;
};

export type PostWithImageCoverWithCategoryWithTags = {
  id: string;
  rootId: string;
  title: string;
  slug: string;
  description: string;
  imageCover: Media | null;
  postCategories: {
    category: {
      rootId: string | null;
      title: string;
      slug: string;
    };
  }[];
  tags: Tag[];
  postAuthors: {
    user: User;
    sort: number;
  }[];
  updatedAt: Date;
};

export type PostWithImageCoverWithCategoryWithTagsWithSeo = {
  id: string;
  rootId: string | null;
  title: string;
  slug: string;
  description: string | null;
  editorType: EditorType;
  bodyData: any;
  tiptapBodyData: any;
  publishedAt: Date | null;
  updatedAt: Date;
  imageCover: {
    url: string;
    altText: string | null;
  } | null;
  postCategories: {
    category: {
      rootId: string | null;
      title: string;
      slug: string;
    };
  }[];
  tags: { title: string; slug: string }[];
  seo: { title: string; description: string | null } | null;
  postAuthors: {
    user: User;
    sort: number;
  }[];
};

type GetPublishedPosts = {
  page: number;
  s?: string;
};

type GetPublishedPostsByCategoryId = {
  categoryRootId: string;
};

type GetPublishedPostsByTagId = {
  tagRootId: string;
};

export const getPublishedPosts = async ({
  page,
  s = "",
}: GetPublishedPosts) => {
  const skip = POST_PER_PAGE * (page - 1);

  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      OR: [
        {
          title: { contains: s },
        },
        {
          description: { contains: s },
        },
      ],
    },
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
              rootId: true,
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
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
  });

  const totalPages = Math.ceil(totalPosts / POST_PER_PAGE);

  return { posts, totalPages, currentPage: page };
};
export const getPublishedDraftPosts = async ({
  page,
  s = "",
}: GetPublishedPosts) => {
  const skip = POST_PER_PAGE * (page - 1);

  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.DRAFT,
      isLatest: true,
      OR: [
        {
          title: { contains: s },
        },
        {
          description: { contains: s },
        },
      ],
    },
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
              rootId: true,
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
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
  });

  const totalPages = Math.ceil(totalPosts / POST_PER_PAGE);

  return { posts, totalPages, currentPage: page };
};

export const getPublishedPostsBuilding = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
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

export const getPublishedDraftPostsBuilding = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.DRAFT,
      isLatest: true,
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

export const getPublishedPostsByCategoryRootId = async ({
  categoryRootId,
}: GetPublishedPostsByCategoryId) => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      postCategories: {
        some: {
          category: {
            rootId: { equals: categoryRootId },
          },
        },
      },
    },
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

  const totalPosts = await db.post.count({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      postCategories: {
        some: {
          category: {
            rootId: { equals: categoryRootId },
          },
        },
      },
    },
  });

  return { posts };
};

export const getPublishedPostsByTagRootId = async ({
  tagRootId,
}: GetPublishedPostsByTagId) => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      tags: {
        some: { rootId: { equals: tagRootId } },
      },
    },
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
};

export const getPublishedPostById = async (id: string) => {
  const post = await db.post.findFirst({
    where: {
      id: id,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const lastPublishedPost = { ...post };

  return lastPublishedPost;
};

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
export const getPublishedDraftPostBySlug = async (slug: string) => {
  const post = await db.post.findFirst({
    where: {
      slug,
      status: ContentStatus.DRAFT,
      isLatest: true,
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

export const getLatestPublishedPosts = async () => {
  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
      user: true,
    },
    take: LATEST_PUBLISHED_POST,
    orderBy: {
      firstPublishedAt: "desc",
    },
  });
  return posts;
};

export const createNewVersionPost = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedPost = await db.post.findFirst({
    where: {
      rootId,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      tags: true,
      postCategories: true,
      postAuthors: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedPost) {
    return { message: "Post not found", status: 404, post: null };
  }

  // Creo nuova versione
  const post = await db.post.create({
    data: {
      title: values.title || publishedPost.title,
      slug: values.slug || publishedPost.slug,
      version: publishedPost.version + 1,
      status: ContentStatus.CHANGED,
      isLatest: false,
      bodyData: [{ type: "paragraph", children: [{ text: "" }] }],
    },
  });

  const updatedPost = await db.post.update({
    where: { id: post.id },
    data: {
      ...publishedPost,
      ...values,
      id: undefined,
      version: undefined,
      status: undefined,
      isLatest: undefined,
      postCategories: undefined,
      tags: values.tags
        ? {
            set: values.tags.map((tag: { id: string }) => ({
              id: tag.id,
            })),
          }
        : publishedPost.tags.length > 0
        ? {
            set: publishedPost.tags.map((tag) => ({
              id: tag.id,
            })),
          }
        : undefined,
      postAuthors: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  const newCategories = values.categories
    ? [...values.categories]
    : [...publishedPost.postCategories];

  if (newCategories) {
    for (const category of newCategories) {
      await db.postCategory.create({
        data: {
          postId: post.id,
          categoryId: category.categoryId,
          sort: category.sort,
        },
      });
    }
  }

  const newAuthors = values.authors
    ? [...values.authors]
    : [...publishedPost.postAuthors];

  if (newAuthors) {
    for (const author of newAuthors) {
      await db.postAuthor.create({
        data: {
          postId: post.id,
          userId: author.userId,
          sort: author.sort,
        },
      });
    }
  }

  return { message: "", status: 200, post: updatedPost };
};
