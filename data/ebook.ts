import { ContentStatus, Product, ProductCategory } from "@prisma/client";

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
      category: ProductCategory.EBOOK,
    },
    include: {
      imageCover: true,
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
      category: ProductCategory.EBOOK,
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
      category: ProductCategory.EBOOK,
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

  if (!isEbookMetadata(product.metadata)) return;

  const mappedProduct = {
    ...product,
  };

  return mappedProduct;
};

export const getPublishedEbooksBuilding = async (): Promise<Product[]> => {
  const products = await db.product.findMany({
    where: {
      isLatest: true,
      status: ContentStatus.PUBLISHED,
      category: ProductCategory.EBOOK,
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
