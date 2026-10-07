import z from "zod";

import { TRPCError } from "@trpc/server";

import { ContentStatus } from "@/generated/prisma";

import { createProductCategorySeo } from "@/lib/seo";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { revalidateContent } from "@/shared/lib/revalidate-content";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

import {
  productCategoryInsertSchema,
  productCategoryUpdateSchema,
  productCategoryUpdateSeoSchema,
} from "../schemas";

import {
  createNewVersion,
  PRODUCT_CATEGORY_NOT_FOUND,
} from "../lib/create-new-version";

const findCategoryOrThrow = async (id: string) => {
  const category = await db.productCategory.findUnique({ where: { id } });

  if (!category) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product category not found.",
    });
  }

  return category;
};

export const productCategoriesRouter = createTRPCRouter({
  create: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_CREATE)
    .input(productCategoryInsertSchema)
    .mutation(async ({ input }) => {
      const category = await db.productCategory.create({
        data: {
          title: input.title,
          slug: input.slug,
          version: 1,
          status: ContentStatus.DRAFT,
        },
      });

      const rootedCategory = await db.productCategory.update({
        where: { id: category.id },
        data: { rootId: category.id },
      });

      await createProductCategorySeo(rootedCategory);

      return db.productCategory.findUniqueOrThrow({
        where: { id: category.id },
        include: { seo: true },
      });
    }),

  update: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_UPDATE)
    .input(productCategoryUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        return await createNewVersion(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (
          error instanceof Error &&
          error.message === PRODUCT_CATEGORY_NOT_FOUND
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "La categoria richiesta non esiste.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Errore durante il salvataggio della categoria.",
        });
      }
    }),

  updateSeo: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_UPDATE)
    .input(productCategoryUpdateSeoSchema)
    .mutation(async ({ input }) => {
      const category = await db.productCategory.findUnique({
        where: { id: input.id, rootId: input.rootId },
      });

      if (!category || !category.seoId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product category not found.",
        });
      }

      const updatedSeo = await db.seo.update({
        where: { id: category.seoId },
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
        id: category.id,
        rootId: input.rootId,
        seoId: updatedSeo.id,
      });

      return updatedSeo;
    }),

  remove: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_DELETE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const category = await findCategoryOrThrow(input.id);

      const versions = await db.productCategory.findMany({
        where: { rootId: category.rootId },
        select: { seoId: true },
      });

      const deletedCategory = await db.productCategory.deleteMany({
        where: { rootId: category.rootId },
      });

      const seoIds = [
        ...new Set(versions.map((version) => version.seoId).filter(Boolean)),
      ] as string[];

      if (seoIds.length > 0) {
        await db.seo.deleteMany({ where: { id: { in: seoIds } } });
      }

      return deletedCategory;
    }),

  getOne: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_READ)
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const category = await db.productCategory.findUnique({
        where: { id: input.id },
        include: { seo: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product category not found.",
        });
      }

      return category;
    }),

  getLastByRootId: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_READ)
    .input(z.object({ rootId: z.string().min(1) }))
    .query(async ({ input }) => {
      const category = await db.productCategory.findFirst({
        where: { rootId: input.rootId },
        orderBy: { createdAt: "desc" },
        include: { seo: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product category not found.",
        });
      }

      return category;
    }),

  getMany: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_READ)
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
      }),
    )
    .query(async ({ input }) => {
      const search = input.search?.trim();

      const where = {
        title: search
          ? { contains: search, mode: "insensitive" as const }
          : undefined,
        status: input.status ? { in: [input.status] } : undefined,
      };

      const [items, distinctCategories] = await Promise.all([
        db.productCategory.findMany({
          where,
          distinct: ["rootId"],
          include: { seo: true },
          orderBy: { createdAt: "desc" },
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
        }),
        db.productCategory.groupBy({
          by: ["rootId"],
          where,
        }),
      ]);

      return {
        items,
        total: distinctCategories.length,
        totalPages: Math.ceil(distinctCategories.length / input.pageSize),
      };
    }),

  publish: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_PUBLISH)
    .input(z.object({ id: z.string().min(1), rootId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const category = await db.productCategory.findFirst({
        where: { id: input.id, rootId: input.rootId },
        select: { title: true, version: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product category not found.",
        });
      }

      if (!category.title) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required fields.",
        });
      }

      await db.productCategory.updateMany({
        where: { rootId: input.rootId },
        data: { isLatest: false },
      });

      const publishedCategory = await db.productCategory.update({
        where: { id: input.id },
        data: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          firstPublishedAt:
            category.version === 1 ? new Date() : undefined,
          publishedAt: new Date(),
        },
        include: { seo: true },
      });

      revalidateContent("product");

      return publishedCategory;
    }),

  unpublish: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_PUBLISH)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await findCategoryOrThrow(input.id);

      const unpublishedCategory = await db.productCategory.update({
        where: { id: input.id },
        data: { status: ContentStatus.CHANGED },
      });

      revalidateContent("product");

      return unpublishedCategory;
    }),
});
