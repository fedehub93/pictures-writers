import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import type { Prisma } from "@/generated/prisma";

import { createTagSeo } from "@/lib/seo";
import { buildListOrderBy } from "@/shared/lib/list-sorting";

import { tagInsertSchema, tagUpdateSchema, tagUpdateSeoSchema } from "../schemas";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  TAG_LIST_SORTS,
} from "../constants";

export const tagsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(tagInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const tag = await db.tag.create({
        data: {
          ...input,
          userId: ctx.auth.id,
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required parameters!",
        });
      }

      await createTagSeo(tag);

      return tag;
    }),

  update: protectedProcedure
    .input(tagUpdateSchema)
    .mutation(async ({ input }) => {
      const existing = await db.tag.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Il tag richiesto non esiste.",
        });
      }

      return db.tag.update({
        where: { id: input.id },
        data: {
          title: input.title,
          slug: input.slug,
          description: input.description,
        },
      });
    }),

  updateSeo: protectedProcedure
    .input(tagUpdateSeoSchema)
    .mutation(async ({ input }) => {
      const tag = await db.tag.findUnique({
        where: { id: input.id },
      });

      if (!tag || !tag.seoId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found",
        });
      }

      return db.seo.update({
        where: { id: tag.seoId },
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

      const deletedTag = await db.tag.delete({
        where: { id: tag.id },
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
        include: {
          seo: true,
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
        sort: z.enum(TAG_LIST_SORTS).nullish(),
        direction: z.enum(["asc", "desc"]).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const where: Prisma.TagWhereInput = {
        title: input.search
          ? { contains: input.search, mode: "insensitive" }
          : undefined,
      };

      const total = await db.tag.count({ where });
      const totalPages = Math.ceil(total / input.pageSize);
      const orderBy = buildListOrderBy<Prisma.TagOrderByWithRelationInput>({
        sort: input.sort,
        direction: input.direction,
        sortable: TAG_LIST_SORTS,
      }) ?? [{ createdAt: "desc" }, { id: "asc" }];

      const items = await db.tag.findMany({
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
