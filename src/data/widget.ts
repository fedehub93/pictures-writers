import { ContentStatus, Prisma, WidgetType } from "@/generated/prisma";

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
import { DEFAULT_SOCIAL_CHANNEL_VALUES } from "@/constants";
import {
  isEbookMetadata,
  isServiceMetadata,
  isWebinarMetadata,
} from "@/modules/shop/products/types";

import { getSettings } from "./settings";
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
  postCategories?: {
    category: {
      id: string;
    };
  }[];
  categoryFilter: WidgetPostCategoryFilter;
  categories: string[];
  limit: number;
};

export const getWidgetPosts = async ({
  postType,
  posts,
  postCategories,
  categoryFilter,
  categories,
  limit,
}: GetWidgetPosts) => {
  let whereClause: Prisma.PostRootWhereInput = {
    liveVersion: { isNot: null },
  };

  let hasLimit = false;

  switch (postType) {
    case WidgetPostType.ALL:
      hasLimit = true;
      break;

    case WidgetPostType.SPECIFIC:
      if (posts.length > 0) {
        whereClause.id = { in: posts.map((p) => p.rootId) };
      }
      hasLimit = false;
      break;

    case WidgetPostType.POPULAR:
      whereClause = {
        ...whereClause,
      };
      hasLimit = true;
      break;

    case WidgetPostType.LATEST:
      whereClause = {
        ...whereClause,
      };
      hasLimit = true;
      break;

    case WidgetPostType.CORRELATED:
      whereClause = {
        ...whereClause,
      };
      hasLimit = false;
      break;

    default:
      throw new Error("Invalid WidgetPostType");
  }
  if (
    categoryFilter === WidgetPostCategoryFilter.CURRENT &&
    postCategories?.length
  ) {
    whereClause.liveVersion = {
      is: {
        categories: {
          some: {
            category: {
              id: { in: postCategories.map((c) => c.category.id) },
            },
          },
        },
      },
    };
  }
  if (
    categoryFilter === WidgetPostCategoryFilter.SPECIFIC &&
    categories.length > 0
  ) {
    whereClause.liveVersion = {
      is: {
        categories: {
          some: {
            category: {
              id: { in: categories },
            },
          },
        },
      },
    };
  }

  const roots = await db.postRoot.findMany({
    where: whereClause,
    include: {
      liveVersion: {
        include: {
          imageCover: true,
        },
      },
    },
    orderBy: { firstPublishedAt: "desc" },
    take: hasLimit ? limit : undefined,
  });

  return roots
    .filter((root) => Boolean(root.liveVersion))
    .map((root) => ({
      ...root.liveVersion!,
      rootId: root.id,
      slug: root.slug,
    }));
};

type GetWidgetCategories = {
  categoryType: WidgetCategoryType;
  limit: number;
};

export const getWidgetCategories = async ({
  categoryType,
  limit,
}: GetWidgetCategories) => {
  const whereClause: Prisma.CategoryWhereInput = {
    postCategories: {
      some: {
        post: {
          status: ContentStatus.PUBLISHED,
        },
      },
    },
  };

  switch (categoryType) {
    case WidgetCategoryType.ALL:
      break;

    default:
      throw new Error("Invalid WidgetCategoryType");
  }

  const categoriessData = await db.category.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
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
  const whereClause: Prisma.ProductWhereInput = {
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
    if (isServiceMetadata(product.metadata)) {
      mappedProducts.push({
        ...product,
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
