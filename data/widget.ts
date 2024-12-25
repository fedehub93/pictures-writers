import { db } from "@/lib/db";
import {
  WidgetCategoryMetadata,
  WidgetCategoryType,
  WidgetPostCategoryFilter,
  WidgetPostMetadata,
  WidgetPostType,
  WidgetProductMetadata,
  WidgetProductType,
  WidgetSearchMetadata,
} from "@/types";
import { ContentStatus, WidgetType } from "@prisma/client";

export const setDefaultWidgetSearchMetadata = (): WidgetSearchMetadata => {
  return {
    label: "",
    type: WidgetType.SEARCH_BOX,
    isDynamic: true,
  };
};

export const setDefaultWidgetPostMetadata = (): WidgetPostMetadata => {
  return {
    label: "",
    type: WidgetType.POST,
    postType: WidgetPostType.ALL,
    posts: [],
    categoryFilter: WidgetPostCategoryFilter.ALL,
    categories: [],
    limit: 0,
  };
};

export const setDefaultWidgetCategoryMetadata = (): WidgetCategoryMetadata => {
  return {
    label: "",
    type: WidgetType.CATEGORY,
    categoryType: WidgetCategoryType.ALL,
    limit: 0,
  };
};

export const setDefaultWidgetProductMetadata = (): WidgetProductMetadata => {
  return {
    label: "",
    type: WidgetType.PRODUCT,
    productType: WidgetProductType.ALL,
    products: [],
    limit: 0,
  };
};

type GetWidgetPosts = {
  postType: WidgetPostType;
  posts: { id: string; sort: number }[];
  postCategoryId: string;
  categoryFilter: WidgetPostCategoryFilter;
  categories: string[];
  limit: number;
};

export const getWidgetPosts = async ({
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
        whereClause.id = { in: posts.map((p) => p.id) };
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

type GetWidgetCategories = {
  categoryType: WidgetCategoryType;
  limit: number;
};

export const getWidgetCategories = async ({
  categoryType,
  limit,
}: GetWidgetCategories) => {
  let whereClause: any = {
    status: ContentStatus.PUBLISHED,
    isLatest: true,
  };

  switch (categoryType) {
    case WidgetCategoryType.ALL:
      break;

    default:
      throw new Error("Invalid WidgetCategoryType");
  }

  const categoriessData = await db.category.findMany({
    where: whereClause,
    orderBy: { firstPublishedAt: "desc" },
    take: limit,
  });

  return categoriessData;
};

type GetWidgetProducts = {
  productType: WidgetProductType;
  products: { id: string; sort: number }[];
  limit: number;
};

export const getWidgetProducts = async ({
  productType,
  products,
  limit,
}: GetWidgetProducts) => {
  let whereClause: any = {
    status: ContentStatus.PUBLISHED,
    isLatest: true,
  };

  let take: any = limit;

  switch (productType) {
    case WidgetProductType.ALL:
      break;

    case WidgetProductType.SPECIFIC:
      if (products.length > 0) {
        whereClause.id = { in: products.map((p) => p.id) };
      }
      take = undefined;
      break;

    default:
      throw new Error("Invalid WidgetProductType");
  }

  const productsData = await db.product.findMany({
    where: whereClause,
    include: {
      imageCover: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return productsData;
};
