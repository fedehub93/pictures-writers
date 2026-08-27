import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { ContentStatus } from "@/generated/prisma";

import { createCategorySeo } from "@/lib/seo";

import {
  categoryInsertSchema,
  categoryUpdateSchema,
  categoryUpdateSeoSchema,
} from "../schemas";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

import { createNewVersion } from "../lib/create-new-version";

export const categoriesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(categoryInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const category = await db.category.create({
        data: {
          ...input,
          version: 1,
          status: ContentStatus.DRAFT,
          userId: ctx.auth.id,
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required parameters!",
        });
      }

      const updatedCategory = await db.category.update({
        where: { id: category.id },
        data: { rootId: category.id },
      });

      await createCategorySeo(updatedCategory);

      return category;
    }),

  update: protectedProcedure
    .input(categoryUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const category = await createNewVersion(input);

        return category;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
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

  updateSeo: protectedProcedure
    .input(categoryUpdateSeoSchema)
    .mutation(async ({ input }) => {
      try {
        const category = await db.category.findUnique({
          where: {
            id: input.id,
            rootId: input.rootId,
          },
        });

        if (!category || !category.rootId || !category.seoId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }

        const updatedSeo = await db.seo.update({
          where: { id: category.seoId },
          data: { ...input, id: undefined, rootId: undefined },
        });

        await createNewVersion({
          id: category.id,
          rootId: category.rootId,
          seoId: updatedSeo.id,
        });

        return updatedSeo;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
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

      const deletedCategory = await db.category.deleteMany({
        where: { rootId: category.rootId },
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
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return category;
    }),
  getLastByRootId: protectedProcedure
    .input(z.object({ rootId: z.string() }))
    .query(async ({ input }) => {
      const category = await db.category.findFirst({
        where: {
          rootId: input.rootId,
        },
        orderBy: {
          publishedAt: "desc",
        },
        select: {
          id: true,
          rootId: true,
          title: true,
          description: true,
          slug: true,
          status: true,
          updatedAt: true,
          seo: {
            select: {
              id: true,
              rootId: true,
              title: true,
              description: true,
              canonicalUrl: true,
              ogTwitterTitle: true,
              ogTwitterDescription: true,
              noIndex: true,
              noFollow: true,
            },
          },
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
      const categories = await db.category.findMany({
        where: {
          title: input.search
            ? { contains: input.search, mode: "insensitive" }
            : undefined,
          status: input.status ? { in: [input.status] } : undefined,
        },
        distinct: ["rootId"],
        include: {
          seo: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });

      return categories;
    }),
  publish: protectedProcedure
    .input(z.object({ id: z.string(), rootId: z.string() }))
    .mutation(async ({ input }) => {
      const category = await db.category.findFirst({
        where: {
          id: input.id,
          rootId: input.rootId,
        },
        select: {
          title: true,
          version: true,
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      if (!category.title) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required fields",
        });
      }

      await db.category.updateMany({
        where: { rootId: input.rootId },
        data: { isLatest: false },
      });

      const publishedCategory = await db.category.update({
        where: {
          id: input.id,
        },
        data: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          firstPublishedAt: category.version === 1 ? new Date() : undefined,
          publishedAt: new Date(),
        },
        include: {
          seo: true,
        },
      });

      return publishedCategory;
    }),
  unpublish: protectedProcedure
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
          message: "Cagtegory not found",
        });
      }

      const unpublishedCategory = await db.category.update({
        where: { id: input.id },
        data: { status: ContentStatus.CHANGED },
      });

      return unpublishedCategory;
    }),
});
