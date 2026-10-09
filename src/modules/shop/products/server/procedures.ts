import z from "zod";

import { TRPCError } from "@trpc/server";
import type { Prisma } from "@/generated/prisma";

import { ContentStatus, ProductType } from "@/generated/prisma";

import { createProductSeo } from "@/lib/seo";
import {
  buildListOrderBy,
  sortByDefaultOrder,
} from "@/shared/lib/list-sorting";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { revalidateContent } from "@/shared/lib/revalidate-content";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  PRODUCT_LIST_SORTS,
} from "../constants";

import {
  productInsertSchema,
  productUpdateSchema,
  productUpdateSeoSchema,
} from "../schemas";

import {
  createNewVersion,
  PRODUCT_METADATA_MISMATCH,
  PRODUCT_NOT_FOUND,
} from "../lib/create-new-version";
import { getDefaultProductMetadata } from "../lib/default-metadata";
import { getPublishedProductByRootId } from "./queries/get-published-product-by-root-id";

const findProductOrThrow = async (id: string) => {
  const product = await db.product.findUnique({ where: { id } });

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product not found.",
    });
  }

  return product;
};

export const productsRouter = createTRPCRouter({
  create: permissionProcedure(PERMISSIONS.PRODUCTS_CREATE)
    .input(productInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const product = await db.product.create({
        data: {
          title: input.title,
          slug: input.slug,
          type: input.type,
          version: 1,
          status: ContentStatus.DRAFT,
          price: 0,
          metadata: getDefaultProductMetadata(input.type),
          userId: ctx.auth.id,
        },
      });

      const rootedProduct = await db.product.update({
        where: { id: product.id },
        data: { rootId: product.id },
      });

      await createProductSeo(rootedProduct);

      return db.product.findUniqueOrThrow({
        where: { id: product.id },
        include: { seo: true },
      });
    }),

  update: permissionProcedure(PERMISSIONS.PRODUCTS_UPDATE)
    .input(productUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        return await createNewVersion(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === PRODUCT_NOT_FOUND) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Il prodotto richiesto non esiste.",
          });
        }

        if (
          error instanceof Error &&
          error.message === PRODUCT_METADATA_MISMATCH
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "I metadati non corrispondono al tipo di prodotto.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Errore durante il salvataggio del prodotto.",
        });
      }
    }),

  updateSeo: permissionProcedure(PERMISSIONS.PRODUCTS_UPDATE)
    .input(productUpdateSeoSchema)
    .mutation(async ({ input }) => {
      const product = await db.product.findUnique({
        where: { id: input.id, rootId: input.rootId },
      });

      if (!product || !product.seoId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      const updatedSeo = await db.seo.update({
        where: { id: product.seoId },
        data: {
          title: input.title,
          description: input.description,
          canonicalUrl: input.canonicalUrl,
          ogTwitterTitle: input.ogTwitterTitle,
          ogTwitterDescription: input.ogTwitterDescription,
          noIndex: input.noIndex,
          noFollow: input.noFollow,
        },
      });

      await createNewVersion({
        id: product.id,
        rootId: input.rootId,
      });

      return updatedSeo;
    }),

  remove: permissionProcedure(PERMISSIONS.PRODUCTS_DELETE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const product = await findProductOrThrow(input.id);

      const versions = await db.product.findMany({
        where: { rootId: product.rootId },
        select: { seoId: true },
      });

      const deletedProduct = await db.product.deleteMany({
        where: { rootId: product.rootId },
      });

      const seoIds = [
        ...new Set(versions.map((version) => version.seoId).filter(Boolean)),
      ] as string[];

      if (seoIds.length > 0) {
        await db.seo.deleteMany({ where: { id: { in: seoIds } } });
      }

      return deletedProduct;
    }),

  getOne: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const root = await db.productRoot.findUnique({
        where: { id: input.id },
        include: {
          currentVersion: {
            include: {
              seo: true,
              imageCover: true,
              category: true,
              gallery: {
                include: { media: true },
                orderBy: { sort: "asc" },
              },
              faqs: { orderBy: { sort: "asc" } },
            },
          },
        },
      });

      if (!root || !root.currentVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      return {
        ...root.currentVersion,
        rootId: root.id,
        slug: root.slug,
        type: root.type,
      };
    }),

  getLastByRootId: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(z.object({ rootId: z.string().min(1) }))
    .query(async ({ input }) => {
      const root = await db.productRoot.findUnique({
        where: { id: input.rootId },
        include: {
          currentVersion: {
            include: {
              seo: true,
              imageCover: true,
              category: true,
              gallery: {
                include: { media: true },
                orderBy: { sort: "asc" },
              },
              faqs: { orderBy: { sort: "asc" } },
            },
          },
        },
      });

      if (!root || !root.currentVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      return {
        ...root.currentVersion,
        rootId: root.id,
        slug: root.slug,
        type: root.type,
      };
    }),

  getPublishedByRootId: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(z.object({ rootId: z.string().min(1) }))
    .query(async ({ input }) => {
      return getPublishedProductByRootId(input.rootId);
    }),

  getMany: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        status: z
          .enum([
            ContentStatus.DRAFT,
            ContentStatus.CHANGED,
            ContentStatus.PUBLISHED,
          ])
          .nullish(),
        type: z.enum(ProductType).nullish(),
        category: z.string().nullish(),
        sort: z.enum(PRODUCT_LIST_SORTS).nullish(),
        direction: z.enum(["asc", "desc"]).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const search = input.search?.trim();

      const where: Prisma.ProductRootWhereInput = {
        currentVersion: {
          is: {
            title: search
              ? { contains: search, mode: "insensitive" }
              : undefined,
            status: input.status ? { in: [input.status] } : undefined,
            categoryId: input.category ? input.category : undefined,
          },
        },
        type: input.type ? { in: [input.type] } : undefined,
      };

      const include = {
        currentVersion: {
          include: {
            imageCover: true,
            category: true,
          },
        },
      } satisfies Prisma.ProductRootInclude;

      const mapItem = (
        root: Prisma.ProductRootGetPayload<{ include: typeof include }>,
      ) => {
        const version = root.currentVersion;
        if (!version) return null;

        return {
          id: version.id,
          rootId: root.id,
          title: version.title,
          slug: root.slug,
          type: root.type,
          status: version.status,
          price: version.price,
          discountedPrice: version.discountedPrice,
          metadata: version.metadata,
          publishedAt: version.publishedAt,
          firstPublishedAt: root.firstPublishedAt,
          createdAt: version.createdAt,
          updatedAt: version.updatedAt,
          imageCover: version.imageCover,
          category: version.category,
        };
      };

      const orderBy =
        buildListOrderBy<Prisma.ProductRootOrderByWithRelationInput>({
          sort: input.sort,
          direction: input.direction,
          sortable: PRODUCT_LIST_SORTS,
          relation: input.sort === "type" ? undefined : "currentVersion",
        });

      if (orderBy) {
        const [roots, total] = await Promise.all([
          db.productRoot.findMany({
            where,
            include,
            orderBy,
            take: input.pageSize,
            skip: (input.page - 1) * input.pageSize,
          }),
          db.productRoot.count({ where }),
        ]);

        const items = roots
          .map(mapItem)
          .filter((item): item is NonNullable<typeof item> => item !== null);

        return {
          items,
          total,
          totalPages: Math.ceil(total / input.pageSize),
        };
      }

      const roots = await db.productRoot.findMany({ where, include });

      const rows = roots
        .map((root) => {
          const version = root.currentVersion;
          if (!version) return null;

          return {
            id: root.id,
            title: version.title,
            status: version.status,
            publishedAt: version.publishedAt,
            root,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      const total = rows.length;
      const totalPages = Math.ceil(total / input.pageSize);

      const items = sortByDefaultOrder(rows)
        .slice((input.page - 1) * input.pageSize, input.page * input.pageSize)
        .map(({ root }) => mapItem(root))
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return { items, total, totalPages };
    }),

  getByRootIds: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(z.object({ ids: z.array(z.uuid()).nonempty() }))
    .query(async ({ input }) => {
      const roots = await db.productRoot.findMany({
        where: {
          id: { in: input.ids },
          liveVersion: { isNot: null },
        },
        include: {
          liveVersion: {
            select: {
              id: true,
              title: true,
              imageCover: { select: { url: true } },
            },
          },
        },
      });

      return roots.map((root) => ({
        id: root.liveVersion!.id,
        rootId: root.id,
        title: root.liveVersion!.title,
        imageCover: root.liveVersion!.imageCover,
      }));
    }),

  publish: permissionProcedure(PERMISSIONS.PRODUCTS_PUBLISH)
    .input(z.object({ id: z.string().min(1), rootId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const product = await db.product.findFirst({
        where: { id: input.id, rootId: input.rootId },
        select: { title: true, firstPublishedAt: true },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      if (!product.title) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required fields.",
        });
      }

      await db.product.updateMany({
        where: { rootId: input.rootId },
        data: { isLatest: false },
      });

      const now = new Date();

      const publishedProduct = await db.product.update({
        where: { id: input.id },
        data: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          publishedAt: now,
          firstPublishedAt:
            product.firstPublishedAt === null ? now : undefined,
        },
        include: { seo: true },
      });

      revalidateContent("product");

      return publishedProduct;
    }),

  unpublish: permissionProcedure(PERMISSIONS.PRODUCTS_PUBLISH)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const product = await findProductOrThrow(input.id);

      await db.product.updateMany({
        where: { rootId: product.rootId },
        data: { isLatest: false },
      });

      const unpublishedProduct = await db.product.update({
        where: { id: input.id },
        data: { status: ContentStatus.CHANGED, isLatest: true },
      });

      revalidateContent("product");

      return unpublishedProduct;
    }),
});
