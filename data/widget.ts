import { db } from "@/lib/db";
import { WidgetPostCategoryFilter, WidgetPostType } from "@/types";
import { ContentStatus } from "@prisma/client";

type GetWidgetPosts = {
  postId: string;
  postType: WidgetPostType;
  posts: string[];
  postCategoryId: string;
  categoryFilter: WidgetPostCategoryFilter;
  categories: string[];
  limit: number;
};

export const getWidgetPosts = async ({
  postId,
  postType,
  posts,
  postCategoryId,
  categoryFilter,
  categories,
  limit,
}: GetWidgetPosts) => {
  let whereClause: any = {
    status: ContentStatus.PUBLISHED,
    isLatest: true,
  };

  switch (postType) {
    case WidgetPostType.ALL:
      break;

    case WidgetPostType.SPECIFIC:
      if (posts.length > 0) {
        whereClause.id = { in: posts };
      }
      break;

    case WidgetPostType.POPULAR:
      whereClause = {
        ...whereClause,
      };
      break;

    case WidgetPostType.LATEST:
      whereClause = {
        ...whereClause,
      };
      break;

    case WidgetPostType.CORRELATED:
      whereClause = {
        ...whereClause,
      };
      break;

    default:
      throw new Error("Invalid WidgetPostType");
  }

  if (categoryFilter === WidgetPostCategoryFilter.CURRENT) {
    whereClause.categoryId = { equals: postCategoryId };
  }
  if (
    categoryFilter === WidgetPostCategoryFilter.SPECIFIC &&
    categories.length > 0
  ) {
    whereClause.categoryId = { in: categories };
  }

  const postsData = await db.post.findMany({
    where: whereClause,
    include: {
      imageCover: true,
    },
    orderBy: { firstPublishedAt: "desc" },
    take: limit,
  });

  return postsData;
};
