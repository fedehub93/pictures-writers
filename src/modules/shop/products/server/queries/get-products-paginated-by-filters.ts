import { Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

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
