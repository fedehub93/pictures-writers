import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { ContentStatus } from "@/generated/prisma";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

import {
  pageInsertSchema,
  pageUpdateContentSchema,
  pageUpdateSchema,
} from "../schemas";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";
import { dehydratePuckForms } from "@/puck/utils/dehydrate-puck-forms";

export const pagesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(pageInsertSchema)
    .mutation(async ({ input }) => {
      const page = await db.page.create({
        data: {
          ...input,
          version: 0,
        },
      });
      return page;
    }),
  createNewVersion: protectedProcedure
    .input(pageUpdateContentSchema)
    .mutation(async ({ input }) => {
      const publishedPage = await db.page.findFirst({
        where: {
          rootId: input.rootId,
          status: ContentStatus.PUBLISHED,
          isLatest: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!publishedPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      const dehydratedPuckData = dehydratePuckForms(input.puckData);

      // Creo nuova versione
      const page = await db.page.create({
        data: {
          title: input.title || publishedPage.title,
          slug: input.slug || publishedPage.slug,
          version: publishedPage.version + 1,
          status: ContentStatus.CHANGED,
          isLatest: false,
        },
      });

      const updatePage = await db.page.update({
        where: { id: page.id },
        data: {
          ...publishedPage,
          ...input,
          puckData: dehydratedPuckData,
          id: undefined,
          version: undefined,
          status: undefined,
          isLatest: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          publishedAt: undefined,
        },
      });

      return updatePage;
    }),
  update: protectedProcedure
    .input(pageUpdateSchema)
    .mutation(async ({ input }) => {
      const updatedPage = await db.page.update({
        where: {
          id: input.id,
          rootId: input.rootId,
        },
        data: { ...input },
      });

      if (!updatedPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      return updatedPage;
    }),
  updateContent: protectedProcedure
    .input(pageUpdateContentSchema)
    .mutation(async ({ input }) => {
      const dehydratedPuckData = dehydratePuckForms(input.puckData);

      const updatedPage = await db.page.update({
        where: {
          id: input.id,
          rootId: input.rootId,
        },
        data: { ...input, puckData: dehydratedPuckData },
      });

      if (!updatedPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      return updatedPage;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.page.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const page = await db.page.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      return page;
    }),
  getLastByRootId: protectedProcedure
    .input(z.object({ rootId: z.string() }))
    .query(async ({ input }) => {
      const page = await db.page.findFirst({
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
          slug: true,
          puckData: true,
          status: true,
        },
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      const hydratedPage = {
        ...page,
        puckData: page.puckData ? await hydratePuckForms(page.puckData) : null,
      };

      return hydratedPage;
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
      const pages = await db.page.findMany({
        where: {
          title: input.search
            ? { contains: input.search, mode: "insensitive" }
            : undefined,
          status: input.status ? { in: [input.status] } : undefined,
          isLatest: true,
        },
        distinct: ["rootId"],
        orderBy: {
          publishedAt: "desc",
        },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });
      return pages;
    }),
  publish: protectedProcedure
    .input(z.object({ id: z.string(), rootId: z.string() }))
    .mutation(async ({ input }) => {
      const page = await db.page.findFirst({
        where: {
          id: input.id,
          rootId: input.rootId,
        },
        select: {
          title: true,
          version: true,
        },
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      if (!page.title) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required fields",
        });
      }

      await db.page.updateMany({
        where: { rootId: input.rootId },
        data: { isLatest: false },
      });

      const publishedPage = await db.page.update({
        where: {
          id: input.id,
        },
        data: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          firstPublishedAt: page.version === 1 ? new Date() : undefined,
          publishedAt: new Date(),
        },
        include: {
          seo: true,
        },
      });

      return publishedPage;
    }),
  unpublish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const page = await db.page.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      const unpublishedPage = await db.page.update({
        where: { id: input.id },
        data: { status: ContentStatus.CHANGED },
      });

      return unpublishedPage;
    }),
});
