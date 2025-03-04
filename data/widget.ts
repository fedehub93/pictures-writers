import { ContentStatus, Prisma, WidgetType } from "@prisma/client";

import { db } from "@/lib/db";
import {
  WidgetAuthorMetadata,
  WidgetCategoryMetadata,
  WidgetCategoryType,
  WidgetNewsletterMetadata,
  WidgetProductPopMetadata,
  WidgetPostCategoryFilter,
  WidgetPostMetadata,
  WidgetPostType,
  WidgetProductMetadata,
  WidgetProductType,
  WidgetSearchMetadata,
  WidgetSocialMetadata,
  WidgetTagMetadata,
  WidgetProductPopActionType,
} from "@/types";
import { isEbookMetadata, isWebinarMetadata } from "@/type-guards";

import { DEFAULT_SOCIAL_CHANNEL_VALUES, getSettings } from "./settings";
import { getPurchasedWebinar } from "./webinars";

export const setDefaultWidgetProductPopMetadata =
  (): WidgetProductPopMetadata => {
    return {
      label: "",
      type: WidgetType.PRODUCT_POP,
      autoOpenDelay: 10,
      actionType: WidgetProductPopActionType.GO_TO_PRODUCT,
      productRootId: null,
    };
  };

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

export const setDefaultWidgetSocialMetadata = (): WidgetSocialMetadata => {
  const socials = DEFAULT_SOCIAL_CHANNEL_VALUES.map((v) => ({
    key: v.key,
    isVisible: false,
    sort: 0,
  }));

  return {
    label: "",
    type: WidgetType.SOCIAL,
    socials: [...socials],
  };
};

export const setDefaultWidgetNewsletterMetadata =
  (): WidgetNewsletterMetadata => {
    return {
      label: "",
      type: WidgetType.NEWSLETTER,
    };
  };

export const setDefaultWidgetAuthorMetadata = (): WidgetAuthorMetadata => {
  return {
    label: "",
    type: WidgetType.AUTHOR,
  };
};

export const setDefaultWidgetTagMetadata = (): WidgetTagMetadata => {
  return {
    label: "",
    type: WidgetType.TAG,
  };
};

type GetWidgetPosts = {
  postType: WidgetPostType;
  posts: { rootId: string; sort: number }[];
  postCategoryRootId?: string;
  categoryFilter: WidgetPostCategoryFilter;
  categories: string[];
  limit: number;
};

export const getWidgetPosts = async ({
  postType,
  posts,
  postCategoryRootId,
  categoryFilter,
  categories,
  limit,
}: GetWidgetPosts) => {
  let whereClause: Prisma.PostWhereInput = {
    status: ContentStatus.PUBLISHED,
    isLatest: true,
  };

  switch (postType) {
    case WidgetPostType.ALL:
      break;

    case WidgetPostType.SPECIFIC:
      if (posts.length > 0) {
        whereClause.rootId = { in: posts.map((p) => p.rootId) };
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

  if (
    categoryFilter === WidgetPostCategoryFilter.CURRENT &&
    postCategoryRootId
  ) {
    whereClause.category = {
      rootId: { equals: postCategoryRootId },
    };
  }
  if (
    categoryFilter === WidgetPostCategoryFilter.SPECIFIC &&
    categories.length > 0
  ) {
    whereClause.category = {
      rootId: { in: categories },
    };
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
  products: { rootId: string; sort: number }[];
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
        whereClause.rootId = { in: products.map((p) => p.rootId) };
      }
      take = undefined;
      break;

    default:
      throw new Error("Invalid WidgetProductType");
  }

  const productsData = await db.product.findMany({
    where: whereClause,
    include: {
      category: {
        select: {
          id: true,
          slug: true,
        },
      },
      imageCover: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const mappedProducts = [];

  for (const product of productsData) {
    const purchasedWebinar = await getPurchasedWebinar(product.rootId!);
    if (isEbookMetadata(product.metadata)) {
      mappedProducts.push({
        ...product,
      });
    }
    if (isWebinarMetadata(product.metadata)) {
      mappedProducts.push({
        ...product,
        availableSeats: product.metadata.seats - purchasedWebinar,
      });
    }
  }

  return mappedProducts;
};

type GetWidgetSocial = {
  socials: {
    key: string;
    isVisible: boolean;
    sort: number;
  }[];
};

export const getWidgetSocials = async ({
  socials: widgetSocials,
}: GetWidgetSocial) => {
  const { socials } = await getSettings();
  const mappedSocials = socials.filter((s) => {
    const isFound = widgetSocials.find((sw) => {
      if (sw.key === s.key && sw.isVisible && !!s.url) {
        return true;
      }
      return false;
    });
    return isFound;
  });

  return mappedSocials;
};
