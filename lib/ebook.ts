import {
  ContentStatus,
  Ebook,
  Media,
  Product,
  ProductCategory,
  User,
} from "@prisma/client";

import { db } from "./db";
import { EbookMetadata, EbookType } from "@/types";

const EBOOK_PER_PAGE = 12;

export type EbookWithImageCoverAndAuthor = Product & {
  imageCover: Media | null;
  author: User | null;
};

type GetPublishedEbooks = {
  page: number;
  s?: string;
};

export function isValidEbookFormat(format: string | null): format is EbookType {
  return format === "pdf" || format === "epub" || format === "mobi";
}

export function isEbookMetadata(metadata: unknown): metadata is EbookMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "formats" in metadata &&
    typeof (metadata as any).formats === "object"
  );
}

export const createNewVersionEbook = async (rootId: string, values: any) => {
  // Trovo ultima versione pubblicata
  const publishedEbook = await db.ebook.findFirst({
    where: { rootId, status: ContentStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedEbook) {
    return { message: "Ebook not found", status: 404, ebook: null };
  }

  // Aggiorna la vecchia versione
  // await db.ebook.updateMany({
  //   where: { rootId: rootId },
  //   data: { isLatest: false },
  // });

  const ebook = await db.ebook.create({
    data: {
      title: values.title || publishedEbook.title,
      version: publishedEbook.version + 1,
      status: ContentStatus.CHANGED,
      isLatest: false,
    },
  });

  const updatedEbook = await db.ebook.update({
    where: { id: ebook.id },
    data: {
      ...publishedEbook,
      ...values,
      id: undefined,
      version: undefined,
      status: undefined,
      isLatest: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  return { message: "", status: 200, post: updatedEbook };
};

export const getPublishedEbooks = async ({
  page,
  s = "",
}: GetPublishedEbooks) => {
  const skip = EBOOK_PER_PAGE * (page - 1);

  const ebooks = await db.product.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
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
    let author = null;
    if (isEbookMetadata(ebook.metadata)) {
      author = await db.user.findUnique({
        where: { id: ebook.metadata.authorId },
      });
    }
    mappedEbooks.push({ ...ebook, author });
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
      status: ContentStatus.PUBLISHED,
      isLatest: true,
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

  let author = null;
  if (!isEbookMetadata(product.metadata)) return;

  author = await db.user.findUnique({
    where: { id: product.metadata.authorId },
  });

  const mappedProduct = {
    ...product,
    metadata: { ...product.metadata, author },
  };

  return mappedProduct;
};

export const getPublishedEbooksBuilding = async (): Promise<Product[]> => {
  const products = await db.product.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
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
