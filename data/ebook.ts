import { ContentStatus, Product, ProductType } from "@/prisma/generated/client";

import { db } from "@/lib/db";
import { isEbookMetadata } from "@/type-guards";

const EBOOK_PER_PAGE = 12;

type GetPublishedEbooks = {
  page: number;
};

export const getPublishedEbooks = async ({ page }: GetPublishedEbooks) => {
  const skip = EBOOK_PER_PAGE * (page - 1);

  const ebooks = await db.product.findMany({
    where: {
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      category: {
        slug: { equals: "ebooks" },
      },
    },
    include: {
      imageCover: {
        select: {
          url: true,
          altText: true,
        },
      },
      category: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
    take: EBOOK_PER_PAGE,
    skip: skip,
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedEbooks = [];

  for (const ebook of ebooks) {
    mappedEbooks.push({ ...ebook });
  }

  const totalEbooks = await db.product.count({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      category: {
        slug: { equals: "ebooks" },
      },
    },
  });

  const totalPages = Math.ceil(totalEbooks / EBOOK_PER_PAGE);

  return { ebooks: mappedEbooks, totalPages, currentPage: page };
};

export const getPublishedEbookBySlug = async (slug: string) => {
  const product = await db.product.findFirst({
    where: {
      slug,
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: ProductType.EBOOK,
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

  if (!isEbookMetadata(product.metadata)) return;

  const mappedProduct = {
    ...product,
  };

  return mappedProduct;
};

export const getPublishedEbooksBuilding = async (): Promise<
  { id: string; slug: string }[]
> => {
  const products = await db.product.findMany({
    where: {
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      type: ProductType.EBOOK,
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
