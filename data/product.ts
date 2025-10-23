import { ContentStatus, Prisma, ProductType } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * GetProductsPaginatedByFilter
 */

type GetProductsPaginatedByFiltersParams = {
  page: number;
  where: Prisma.Args<typeof db.product, "findMany">["where"];
};

const PRODUCT_PER_PAGE = 10;

export const getProductsPaginatedByFilters = async ({
  page,
  where,
}: GetProductsPaginatedByFiltersParams) => {
  try {
    const skip = PRODUCT_PER_PAGE * (page - 1);

    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        rootId: true,
        title: true,
        description: true,
        slug: true,
        updatedAt: true,
        category: {
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
        price: true,
        discountedPrice: true,
        metadata: true,
      },
      take: PRODUCT_PER_PAGE,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalProducts = await db.product.count({
      where,
    });

    const totalPages = Math.ceil(totalProducts / PRODUCT_PER_PAGE);

    return { products, totalPages, currentPage: page };
  } catch (error) {
    return { products: [], totalPages: 0, currentPage: 0 };
  }
};

export type GetProductsPaginatedByFiltersReturn = Awaited<
  ReturnType<typeof getProductsPaginatedByFilters>
>;

export const getPublishedProductByRootId = async (rootId: string) => {
  const product = await db.product.findFirst({
    where: {
      rootId,
      isLatest: true,
      status: ContentStatus.PUBLISHED,
    },
    include: {
      imageCover: true,
      seo: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return product;
};

export type GetPublishedProductByRootId = Awaited<
  ReturnType<typeof getPublishedProductByRootId>
>;

export const getPublishedProductBySlug = async (slug: string) => {
  const product = await db.product.findFirst({
    where: {
      slug,
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: { not: ProductType.AFFILIATE },
    },
    select: {
      id: true,
      rootId: true,
      title: true,
      description: true,
      slug: true,
      category: {
        select: {
          title: true,
          description: true,
          slug: true,
        },
      },
      imageCover: {
        select: {
          url: true,
          altText: true,
        },
      },
      gallery: {
        select: {
          media: {
            select: {
              id: true,
              url: true,
              altText: true,
            },
          },
          sort: true,
        },
      },
      metadata: true,
      price: true,
      discountedPrice: true,
      seo: {
        select: {
          title: true,
          description: true,
          canonicalUrl: true,
        },
      },
      acquisitionMode: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return product;
};

export type GetPublishedProductBySlug = Awaited<
  ReturnType<typeof getPublishedProductBySlug>
>;

export const getPublishedProductsBuilding = async () => {
  const products = await db.product.findMany({
    where: {
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: { not: ProductType.AFFILIATE },
    },
    select: {
      id: true,
      slug: true,
      type: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products;
};
