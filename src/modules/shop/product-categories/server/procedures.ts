import z from "zod";

import { TRPCError } from "@trpc/server";

import type { Prisma } from "@/generated/prisma";

import { createProductCategorySeo } from "@/lib/seo";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
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

export const productCategoriesRouter = createTRPCRouter({
  create: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_CREATE)
    .input(productCategoryInsertSchema)
    .mutation(async ({ input }) => {
      const category = await db.productCategory.create({
        data: {
          title: input.title,
          slug: input.slug,
        },
      });

      await createProductCategorySeo(category);

      return db.productCategory.findUniqueOrThrow({
        where: { id: category.id },
        include: { seo: true },
      });
    }),

  update: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_UPDATE)
    .input(productCategoryUpdateSchema)
    .mutation(async ({ input }) => {
      const existing = await db.productCategory.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "La categoria richiesta non esiste.",
        });
      }

      return db.productCategory.update({
        where: { id: input.id },
        data: {
          title: input.title,
          slug: input.slug,
          description: input.description,
        },
      });
    }),

  updateSeo: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_UPDATE)
    .input(productCategoryUpdateSeoSchema)
    .mutation(async ({ input }) => {
      const category = await db.productCategory.findUnique({
        where: { id: input.id },
      });

      if (!category || !category.seoId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product category not found.",
        });
      }

      return db.seo.update({
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
    }),

  remove: permissionProcedure(PERMISSIONS.PRODUCT_CATEGORIES_DELETE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const category = await db.productCategory.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product category not found.",
        });
      }

      const deletedCategory = await db.productCategory.delete({
        where: { id: category.id },
      });

      if (category.seoId) {
        await db.seo.delete({ where: { id: category.seoId } });
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
      }),
    )
    .query(async ({ input }) => {
      const search = input.search?.trim();

      const where: Prisma.ProductCategoryWhereInput = {
        title: search
          ? { contains: search, mode: "insensitive" }
          : undefined,
      };

      const total = await db.productCategory.count({ where });
      const totalPages = Math.ceil(total / input.pageSize);

      const items = await db.productCategory.findMany({
        where,
        include: { seo: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });

      return { items, total, totalPages };
    }),
});
