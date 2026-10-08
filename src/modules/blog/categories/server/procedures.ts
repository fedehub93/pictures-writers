import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import type { Prisma } from "@/generated/prisma";

import { createCategorySeo } from "@/lib/seo";
import { buildListOrderBy } from "@/shared/lib/list-sorting";

import {
  categoryInsertSchema,
  categoryUpdateSchema,
  categoryUpdateSeoSchema,
} from "../schemas";

import {
  CATEGORY_LIST_SORTS,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

export const categoriesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(categoryInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const category = await db.category.create({
        data: {
          ...input,
          userId: ctx.auth.id,
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required parameters!",
        });
      }

      await createCategorySeo(category);

      return category;
    }),

  update: protectedProcedure
    .input(categoryUpdateSchema)
    .mutation(async ({ input }) => {
      const existing = await db.category.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "La categoria richiesta non esiste.",
        });
      }

      return db.category.update({
        where: { id: input.id },
        data: {
          title: input.title,
          slug: input.slug,
          description: input.description,
        },
      });
    }),

  updateSeo: protectedProcedure
    .input(categoryUpdateSeoSchema)
    .mutation(async ({ input }) => {
      const category = await db.category.findUnique({
        where: { id: input.id },
      });

      if (!category || !category.seoId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
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

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const category = await db.category.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      const deletedCategory = await db.category.delete({
        where: { id: category.id },
      });

      if (category.seoId) {
        await db.seo.delete({
          where: { id: category.seoId },
        });
      }

      return deletedCategory;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const category = await db.category.findUnique({
        where: {
          id: input.id,
        },
        include: {
          seo: true,
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return category;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        sort: z.enum(CATEGORY_LIST_SORTS).nullish(),
        direction: z.enum(["asc", "desc"]).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const where: Prisma.CategoryWhereInput = {
        title: input.search
          ? { contains: input.search, mode: "insensitive" }
          : undefined,
      };

      const total = await db.category.count({ where });
      const totalPages = Math.ceil(total / input.pageSize);
      const orderBy = buildListOrderBy<
        Prisma.CategoryOrderByWithRelationInput
      >({
        sort: input.sort,
        direction: input.direction,
        sortable: CATEGORY_LIST_SORTS,
      }) ?? [{ createdAt: "desc" }, { id: "asc" }];

      const items = await db.category.findMany({
        where,
        include: {
          seo: true,
        },
        orderBy,
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });

      return { items, total, totalPages };
    }),
});
