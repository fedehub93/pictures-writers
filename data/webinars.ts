import { ContentStatus, Product, ProductType } from "@prisma/client";

import { db } from "@/lib/db";
import { isWebinarMetadata } from "@/type-guards";

const WEBINAR_PER_PAGE = 12;

type GetPublishedWebinars = {
  page: number;
};

export const getPublishedWebinars = async ({ page }: GetPublishedWebinars) => {
  const skip = WEBINAR_PER_PAGE * (page - 1);

  const webinars = await db.product.findMany({
    where: {
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: ProductType.WEBINAR,
    },
    include: {
      imageCover: true,
    },
    take: WEBINAR_PER_PAGE,
    skip: skip,
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedWebinars = [];

  for (const webinar of webinars) {
    mappedWebinars.push({ ...webinar });
  }

  const totalWebinars = await db.product.count({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      type: ProductType.WEBINAR,
    },
  });

  const totalPages = Math.ceil(totalWebinars / WEBINAR_PER_PAGE);

  return { webinars: mappedWebinars, totalPages, currentPage: page };
};

export const getPublishedWebinarBySlug = async (slug: string) => {
  const product = await db.product.findFirst({
    where: {
      slug,
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: ProductType.WEBINAR,
    },
    include: {
      imageCover: true,
      seo: true,
      gallery: {
        select: {
          mediaId: true,
          media: true,
          sort: true,
        },
        orderBy: {
          sort: "asc",
        },
      },
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!product) return null;

  if (!isWebinarMetadata(product.metadata)) return;

  const mappedProduct = {
    ...product,
  };

  return mappedProduct;
};

export const getPublishedWebinarsBuilding = async (): Promise<Product[]> => {
  const products = await db.product.findMany({
    where: {
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: ProductType.WEBINAR,
    },
    include: {
      imageCover: true,
      seo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products;
};
