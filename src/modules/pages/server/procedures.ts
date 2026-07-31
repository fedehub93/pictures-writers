import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { ContentStatus } from "@/generated/prisma";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

import { createPageSeo } from "@/lib/seo";

import {
  pageInsertSchema,
  pageUpdateSchema,
  pageUpdateSeoSchema,
} from "../schemas";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  INITIAL_PUCK_DATA,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

import { createNewVersion } from "../lib/create-new-version";

export const pagesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(pageInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const page = await db.page.create({
        data: {
          ...input,
          version: 1,
          status: ContentStatus.DRAFT,
          puckData: INITIAL_PUCK_DATA,
          userId: ctx.auth.id,
        },
      });

      if (!page) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required parameters!",
        });
      }

      const updatedPage = await db.page.update({
        where: { id: page.id },
        data: { rootId: page.id },
      });

      await createPageSeo(updatedPage);

      return page;
    }),

  update: protectedProcedure
    .input(pageUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const page = await createNewVersion(input);

        return page;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === "PAGE_NOT_FOUND") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "La pagina richiesta non esiste.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Errore durante il salvataggio della pagina.",
        });
      }
    }),

  updateSeo: protectedProcedure
    .input(pageUpdateSeoSchema)
    .mutation(async ({ input }) => {
      try {
        const page = await db.page.findUnique({
          where: {
            id: input.id,
            rootId: input.rootId,
          },
        });

        if (!page || !page.rootId || !page.seoId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Page not found",
          });
        }

        const updatedSeo = await db.seo.update({
          where: { id: page.seoId },
          data: { ...input, id: undefined, rootId: undefined },
        });

        await createNewVersion({
          id: page.id,
          rootId: page.rootId,
          seoId: updatedSeo.id,
        });

        return updatedSeo;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === "PAGE_NOT_FOUND") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "La pagina richiesta non esiste.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Errore durante il salvataggio della pagina.",
        });
      }
    }),

  remove: protectedProcedure
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

      const deletedPage = await db.page.deleteMany({
        where: { rootId: page.rootId },
      });

      if (page.seoId) {
        await db.seo.delete({
          where: { id: page.seoId },
        });
      }

      return deletedPage;
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

      const hydratedPage = {
        ...page,
        puckData: page.puckData ? await hydratePuckForms(page.puckData) : null,
      };

      return hydratedPage;
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
          seo: {
            select: {
              id: true,
              rootId: true,
              title: true,
              description: true,
              ogTwitterTitle: true,
              ogTwitterDescription: true,
              noIndex: true,
              noFollow: true,
            },
          },
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

      const hydratedPages = await Promise.all(
        pages.map(async (p) => ({
          ...p,
          puckData: p.puckData ? await hydratePuckForms(p.puckData) : null,
        })),
      );

      return hydratedPages;
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
