import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { ContentStatus } from "@/generated/prisma";

import { createPostSeo } from "@/lib/seo";

import {
  postInsertSchema,
  postUpdateSchema,
  postUpdateSeoSchema,
} from "../schemas";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";

import { createNewVersion } from "../lib/create-new-version";

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(postInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const post = await db.post.create({
        data: {
          ...input,
          version: 1,
          status: ContentStatus.DRAFT,
          bodyData: [{ type: "paragraph", children: [{ text: "" }] }],
          userId: ctx.auth.id,
          postAuthors: {
            create: {
              userId: ctx.auth.id,
              sort: 0,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required parameters!",
        });
      }

      const updatedPost = await db.post.update({
        where: { id: post.id },
        data: { rootId: post.id },
      });

      await createPostSeo(updatedPost);

      return post;
    }),

  update: protectedProcedure
    .input(postUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const post = await createNewVersion(input);

        return post;
      } catch (error) {
        console.error(error);
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === "POST_NOT_FOUND") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not exists.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error saving post.",
        });
      }
    }),

  updateSeo: protectedProcedure
    .input(postUpdateSeoSchema)
    .mutation(async ({ input }) => {
      try {
        const post = await db.post.findUnique({
          where: {
            id: input.id,
            rootId: input.rootId,
          },
        });

        if (!post || !post.rootId || !post.seoId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        const updatedSeo = await db.seo.update({
          where: { id: post.seoId },
          data: { ...input, id: undefined, rootId: undefined },
        });

        await createNewVersion({
          id: post.id,
          rootId: post.rootId,
          seoId: updatedSeo.id,
        });

        return updatedSeo;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error && error.message === "POST_NOT_FOUND") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not exists.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error saving post.",
        });
      }
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const post = await db.post.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const deletedPost = await db.post.deleteMany({
        where: { rootId: post.rootId },
      });

      if (post.seoId) {
        await db.seo.delete({
          where: { id: post.seoId },
        });
      }

      return deletedPost;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const post = await db.post.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return post;
    }),
  getLastByRootId: protectedProcedure
    .input(z.object({ rootId: z.string() }))
    .query(async ({ input }) => {
      const post = await db.post.findFirst({
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
          description: true,
          status: true,
          editorType: true,
          bodyData: true,
          tiptapBodyData: true,
          publishedAt: true,
          firstPublishedAt: true,
          updatedAt: true,
          seo: true,
          postCategories: {
            select: {
              category: {
                select: {
                  id: true,
                  rootId: true,
                  title: true,
                  slug: true,
                  status: true,
                },
              },
              sort: true,
            },
          },
          tags: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
            },
            where: {
              isLatest: true,
            },
          },
          imageCover: {
            select: {
              url: true,
              name: true,
              altText: true,
            },
          },
          postAuthors: {
            select: {
              user: true,
              sort: true,
            },
            orderBy: {
              sort: "asc",
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return post;
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
      const posts = await db.post.findMany({
        select: {
          id: true,
          rootId: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          firstPublishedAt: true,
          editorType: true,
          imageCover: {
            select: {
              url: true,
              altText: true,
            },
          },
          postAuthors: {
            select: {
              user: {
                select: {
                  email: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: {
              sort: "asc",
            },
          },
        },
        where: {
          title: input.search
            ? { contains: input.search, mode: "insensitive" }
            : undefined,
          status: input.status ? { in: [input.status] } : undefined,
        },
        distinct: ["rootId"],
        orderBy: {
          publishedAt: "desc",
        },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });

      return posts;
    }),
  publish: protectedProcedure
    .input(z.object({ id: z.string(), rootId: z.string() }))
    .mutation(async ({ input }) => {
      const post = await db.post.findFirst({
        where: {
          id: input.id,
          rootId: input.rootId,
        },
        select: {
          title: true,
          version: true,
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (!post.title) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required fields",
        });
      }

      await db.post.updateMany({
        where: { rootId: input.rootId },
        data: { isLatest: false },
      });

      const publishedPost = await db.post.update({
        where: {
          id: input.id,
        },
        data: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          firstPublishedAt: post.version === 1 ? new Date() : undefined,
          publishedAt: new Date(),
        },
        include: {
          seo: true,
        },
      });

      return publishedPost;
    }),
  unpublish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const post = await db.post.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const unpublishedPost = await db.post.update({
        where: { id: input.id },
        data: { status: ContentStatus.CHANGED },
      });

      return unpublishedPost;
    }),
});
