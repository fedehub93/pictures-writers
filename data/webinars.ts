import { ContentStatus, Product, ProductType } from "@prisma/client";

import { db } from "@/lib/db";
import { isWebinarMetadata } from "@/type-guards";

const WEBINAR_PER_PAGE = 12;

type GetPublishedWebinars = {
  page: number;
};

export const getPurchasedWebinar = async (webinarRootId: string) => {
  const w = await db.purchase.findMany({
    where: { productRootId: webinarRootId },
    select: { id: true },
  });

  return w.length;
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
      category: {
        select: {
          title: true,
          slug: true,
        },
      },
      imageCover: {
        select: {
          altText: true,
          url: true,
        },
      },
    },
    take: WEBINAR_PER_PAGE,
    skip: skip,
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedWebinars = [];

  for (const webinar of webinars) {
    const purchasedWebinar = await getPurchasedWebinar(webinar.rootId!);
    if (isWebinarMetadata(webinar.metadata)) {
      mappedWebinars.push({
        ...webinar,
        availableSeats: webinar.metadata.seats - purchasedWebinar,
      });
    }
  }

  const totalWebinars = await db.product.count({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      category: {
        slug: { equals: "webinars" },
      },
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
      imageCover: {
        select: {
          altText: true,
          url: true,
        },
      },
      category: {
        select: {
          title: true,
          slug: true,
        },
      },
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

  const purchasedWebinar = await getPurchasedWebinar(product.rootId!);

  const mappedProduct = {
    ...product,
    availableSeats: product.metadata.seats - purchasedWebinar,
  };

  return mappedProduct;
};

export const getPublishedWebinarsBuilding = async (): Promise<
  { id: string; slug: string }[]
> => {
  const products = await db.product.findMany({
    where: {
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: ProductType.WEBINAR,
    },
    select: {
      id: true,
      slug: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products;
};
