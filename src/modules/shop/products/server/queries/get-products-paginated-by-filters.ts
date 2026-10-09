import { Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export type ProductListVersion = "live" | "current";

type GetProductsPaginatedByFiltersParams = {
  page: number;
  version?: ProductListVersion;
  where?: Prisma.ProductVersionWhereInput;
  rootWhere?: Prisma.ProductRootWhereInput;
};

const PRODUCT_PER_PAGE = 10;

export const getProductsPaginatedByFilters = async ({
  page,
  version = "live",
  where = {},
  rootWhere = {},
}: GetProductsPaginatedByFiltersParams) => {
  try {
    const skip = PRODUCT_PER_PAGE * (page - 1);

    const rootWhereInput: Prisma.ProductRootWhereInput = {
      ...rootWhere,
      [version === "live" ? "liveVersion" : "currentVersion"]: { is: where },
    };

    const roots = await db.productRoot.findMany({
      where: rootWhereInput,
      include: {
        liveVersion: {
          include: {
            category: { select: { title: true, slug: true } },
            imageCover: { select: { url: true, altText: true } },
          },
        },
        currentVersion: {
          include: {
            category: { select: { title: true, slug: true } },
            imageCover: { select: { url: true, altText: true } },
          },
        },
      },
      take: PRODUCT_PER_PAGE,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalProducts = await db.productRoot.count({ where: rootWhereInput });

    const totalPages = Math.ceil(totalProducts / PRODUCT_PER_PAGE);

    const products = roots
      .map((root) => {
        const v = version === "live" ? root.liveVersion : root.currentVersion;
        if (!v) return null;

        return {
          id: v.id,
          rootId: root.id,
          title: v.title,
          slug: root.slug,
          updatedAt: v.updatedAt,
          category: v.category,
          imageCover: v.imageCover,
          price: v.price,
          discountedPrice: v.discountedPrice,
          metadata: v.metadata,
        };
      })
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product),
      );

    return { products, totalPages, currentPage: page };
  } catch (_error) {
    return { products: [], totalPages: 0, currentPage: 0 };
  }
};

export type GetProductsPaginatedByFiltersReturn = Awaited<
  ReturnType<typeof getProductsPaginatedByFilters>
>;
