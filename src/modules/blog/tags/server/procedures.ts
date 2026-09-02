import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { ContentStatus } from "@/generated/prisma";

import { createTagSeo } from "@/lib/seo";

import {
  tagInsertSchema,
  tagUpdateSchema,
  tagUpdateSeoSchema,
} from "../schemas";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

import { createNewVersion } from "../lib/create-new-version";

export const tagsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(tagInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const tag = await db.tag.create({
        data: {
          ...input,
          version: 1,
          status: ContentStatus.DRAFT,
          userId: ctx.auth.id,
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required parameters!",
        });
      }

      const updatedTag = await db.tag.update({
        where: { id: tag.id },
        data: { rootId: tag.id },
      });

      await createTagSeo(updatedTag);

      return tag;
    }),

  update: protectedProcedure
    .input(tagUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const tag = await createNewVersion(input);

        return tag;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === "TAG_NOT_FOUND") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not exists.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error saving tag.",
        });
      }
    }),

  updateSeo: protectedProcedure
    .input(tagUpdateSeoSchema)
    .mutation(async ({ input }) => {
      try {
        const tag = await db.tag.findUnique({
          where: {
            id: input.id,
            rootId: input.rootId,
          },
        });

        if (!tag || !tag.rootId || !tag.seoId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        const updatedSeo = await db.seo.update({
          where: { id: tag.seoId },
          data: { ...input, id: undefined, rootId: undefined },
        });

        await createNewVersion({
          id: tag.id,
          rootId: tag.rootId,
          seoId: updatedSeo.id,
        });

        return updatedSeo;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === "TAG_NOT_FOUND") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not exists",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error saving tag.",
        });
      }
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const tag = await db.tag.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found",
        });
      }

      const deletedTag = await db.tag.deleteMany({
        where: { rootId: tag.rootId },
      });

      if (tag.seoId) {
        await db.seo.delete({
          where: { id: tag.seoId },
        });
      }

      return deletedTag;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const tag = await db.tag.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found",
        });
      }

      return tag;
    }),
  getLastByRootId: protectedProcedure
    .input(z.object({ rootId: z.string() }))
    .query(async ({ input }) => {
      const tag = await db.tag.findFirst({
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

      if (!tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found",
        });
      }

      return tag;
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
      const tags = await db.tag.findMany({
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

      const distinctTags = await db.tag.groupBy({
        by: ["rootId"],
        where: {
          title: input.search
            ? { contains: input.search, mode: "insensitive" }
            : undefined,
          status: input.status ? { in: [input.status] } : undefined,
        },
      });

      const totalPages = Math.ceil(distinctTags.length / input.pageSize);

      return {
        items: tags,
        total: distinctTags.length,
        totalPages,
      };
    }),
  publish: protectedProcedure
    .input(z.object({ id: z.string(), rootId: z.string() }))
    .mutation(async ({ input }) => {
      const tag = await db.tag.findFirst({
        where: {
          id: input.id,
          rootId: input.rootId,
        },
        select: {
          title: true,
          version: true,
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found",
        });
      }

      if (!tag.title) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required fields",
        });
      }

      await db.tag.updateMany({
        where: { rootId: input.rootId },
        data: { isLatest: false },
      });

      const publishedTag = await db.tag.update({
        where: {
          id: input.id,
        },
        data: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          firstPublishedAt: tag.version === 1 ? new Date() : undefined,
          publishedAt: new Date(),
        },
        include: {
          seo: true,
        },
      });

      return publishedTag;
    }),
  unpublish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const tag = await db.tag.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cagtegory not found",
        });
      }

      const unpublishedTag = await db.tag.update({
        where: { id: input.id },
        data: { status: ContentStatus.CHANGED },
      });

      return unpublishedTag;
    }),
});
