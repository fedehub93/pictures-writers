import z from "zod";
import { db } from "@/shared/lib/db";
import { sortByDefaultOrder } from "@/shared/lib/list-sorting";
import { revalidateContent } from "@/shared/lib/revalidate-content";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { ContentStatus, Prisma } from "@/generated/prisma";

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

import { createPageRootVersion } from "./root-version";
import { savePageVersion } from "./save-page";
import { publishPageVersion, unpublishPageVersion } from "./publish-page";
import { updatePageVersionSeo } from "./update-seo";
import { deletePageRoot } from "./delete-page";
import { toPageTrpcError } from "./errors";

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

      const seo = await createPageSeo(updatedPage);

      await createPageRootVersion(updatedPage, seo?.id ?? null);

      return page;
    }),

  update: protectedProcedure
    .input(pageUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        return await savePageVersion(input);
      } catch (error) {
        throw toPageTrpcError(error, {
          notFoundMessage: "La pagina richiesta non esiste.",
        });
      }
    }),

  updateSeo: protectedProcedure
    .input(pageUpdateSeoSchema)
    .mutation(async ({ input }) => {
      try {
        return await updatePageVersionSeo(input);
      } catch (error) {
        throw toPageTrpcError(error, {
          notFoundMessage: "La pagina richiesta non esiste.",
          internalMessage: "Errore durante il salvataggio della pagina.",
        });
      }
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const deleted = await deletePageRoot({ versionId: input.id });

        revalidateContent("page", deleted.slug);

        return deleted;
      } catch (error) {
        throw toPageTrpcError(error, {
          notFoundMessage: "La pagina richiesta non esiste.",
          internalMessage: "Errore durante l'eliminazione della pagina.",
        });
      }
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const version = await db.pageVersion.findUnique({
        where: {
          id: input.id,
        },
        include: {
          seo: true,
          root: {
            select: {
              slug: true,
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      const { root, ...rest } = version;

      return {
        ...rest,
        slug: root.slug,
        puckData: rest.puckData
          ? await hydratePuckForms(rest.puckData)
          : null,
      };
    }),
  getLastByRootId: protectedProcedure
    .input(z.object({ rootId: z.string() }))
    .query(async ({ input }) => {
      const root = await db.pageRoot.findUnique({
        where: {
          id: input.rootId,
        },
        include: {
          currentVersion: {
            include: {
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
          },
        },
      });

      if (!root || !root.currentVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      const version = root.currentVersion;

      return {
        id: version.id,
        rootId: root.id,
        title: version.title,
        slug: root.slug,
        puckData: version.puckData
          ? await hydratePuckForms(version.puckData)
          : null,
        status: version.status,
        seo: version.seo,
      };
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
      const where: Prisma.PageRootWhereInput = {
        currentVersion: {
          is: {
            title: input.search
              ? { contains: input.search, mode: "insensitive" }
              : undefined,
            status: input.status ? { in: [input.status] } : undefined,
          },
        },
      };

      const roots = await db.pageRoot.findMany({
        where,
        include: {
          currentVersion: {
            include: {
              seo: true,
            },
          },
        },
      });

      const rows = roots
        .map((root) => {
          const version = root.currentVersion;
          if (!version) return null;

          return {
            id: version.id,
            title: version.title,
            status: version.status,
            publishedAt: version.publishedAt,
            version,
            root,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      const total = rows.length;
      const totalPages = Math.ceil(total / input.pageSize);

      const pageRows = sortByDefaultOrder(rows).slice(
        (input.page - 1) * input.pageSize,
        input.page * input.pageSize,
      );

      const items = await Promise.all(
        pageRows.map(async ({ version, root }) => ({
          ...version,
          slug: root.slug,
          firstPublishedAt: root.firstPublishedAt,
          puckData: version.puckData
            ? await hydratePuckForms(version.puckData)
            : null,
        })),
      );

      return {
        items,
        total,
        totalPages,
      };
    }),
  publish: protectedProcedure
    .input(z.object({ id: z.string(), rootId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const publishedPage = await publishPageVersion(input);

        revalidateContent("page", publishedPage.slug);

        return publishedPage;
      } catch (error) {
        throw toPageTrpcError(error, {
          internalMessage: "Failed to publish the page",
        });
      }
    }),
  unpublish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const unpublishedPage = await unpublishPageVersion(input);

        revalidateContent("page", unpublishedPage.slug);

        return unpublishedPage;
      } catch (error) {
        throw toPageTrpcError(error, {
          internalMessage: "Failed to unpublish the page",
        });
      }
    }),
});
