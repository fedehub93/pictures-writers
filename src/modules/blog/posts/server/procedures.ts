import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import {
  ContentStatus,
  ScheduledActionType,
} from "@/generated/prisma";

import { createPostSeo } from "@/lib/seo";
import {
  createScheduledAction,
  createIdempotencyKey,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

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
  POST_BATCH,
} from "../constants";

import { createNewVersion } from "../lib/create-new-version";
import { publishPost, PublishPostError } from "../lib/publish-post";
import {
  cancelSchedule,
  reschedulePost,
  schedulePost,
  ScheduledPostError,
} from "../lib/schedule-post";

import { getPaginatedPosts } from "./queries";

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(postInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const isScheduled = input.scheduledAt && input.scheduledAt > new Date();
      const status = isScheduled
        ? ContentStatus.SCHEDULED
        : ContentStatus.DRAFT;
      const post = await db.post.create({
        data: {
          ...input,
          version: 1,
          status,
          scheduledAt: input.scheduledAt,
          preSchedulingStatus:
            status === ContentStatus.SCHEDULED ? ContentStatus.DRAFT : null,
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

      if (isScheduled && input.scheduledAt) {
        await createScheduledAction({
          type: ScheduledActionType.PUBLISH_POST,
          targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
          targetId: updatedPost.id,
          plannedAt: input.scheduledAt,
          timezone:
            input.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          idempotencyKey: createIdempotencyKey(
            ScheduledActionType.PUBLISH_POST,
            SCHEDULER_TARGET_TYPES.POST_ROOT,
            updatedPost.id,
          ),
        });
      }

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
          scheduledAt: true,
          updatedAt: true,
          version: true,
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
          imageCover: true,
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
            ContentStatus.SCHEDULED,
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
          scheduledAt: true,
          version: true,
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

      const distinctPosts = await db.post.groupBy({
        by: ["rootId"],
        where: {
          title: input.search
            ? { contains: input.search, mode: "insensitive" }
            : undefined,
          status: input.status ? { in: [input.status] } : undefined,
        },
      });

      const totalPages = Math.ceil(distinctPosts.length / input.pageSize);

      return {
        items: posts,
        total: distinctPosts.length,
        totalPages,
      };
    }),
  getPaginated: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        s: z.string().optional().default(""),
        page: z.number().optional().default(1),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { cursor, s, page } = input;

        const { posts, pagination, nextCursor } = await getPaginatedPosts({
          cursor: cursor ?? null,
          searchString: s,
          page,
          postBatch: POST_BATCH,
        });

        return {
          posts,
          pagination,
          nextCursor,
        };
      } catch (error) {
        console.error("[POST_GET]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Errore interno durante il recupero dei post",
        });
      }
    }),
  getPublishedByIds: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.uuid()).nonempty(),
      }),
    )

    .query(async ({ input }) => {
      const posts = await db.post.findMany({
        where: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          rootId: { in: input.ids },
        },
        select: {
          id: true,
          rootId: true,
          title: true,
          imageCover: { select: { url: true } },
          slug: true,
        },
      });

      return posts;
    }),
  publish: protectedProcedure
    .input(z.object({ id: z.string(), rootId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await publishPost({
          postId: input.id,
          rootId: input.rootId,
        });
      } catch (error) {
        if (error instanceof PublishPostError) {
          const code =
            error.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : error.code === "VALIDATION_ERROR"
                ? "BAD_REQUEST"
                : "BAD_REQUEST";

          throw new TRPCError({
            code,
            message: error.message,
          });
        }

        throw error;
      }
    }),
  schedule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        rootId: z.string(),
        scheduledAt: z.coerce.date(),
        timezone: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await schedulePost({
          postId: input.id,
          rootId: input.rootId,
          scheduledAt: input.scheduledAt,
          timezone: input.timezone,
        });
      } catch (error) {
        if (error instanceof ScheduledPostError) {
          const code =
            error.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : error.code === "CONFLICT"
                ? "CONFLICT"
                : "BAD_REQUEST";

          throw new TRPCError({
            code,
            message: error.message,
          });
        }

        throw error;
      }
    }),
  reschedule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        rootId: z.string(),
        scheduledAt: z.coerce.date(),
        timezone: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await reschedulePost({
          postId: input.id,
          rootId: input.rootId,
          scheduledAt: input.scheduledAt,
          timezone: input.timezone,
        });
      } catch (error) {
        if (error instanceof ScheduledPostError) {
          const code =
            error.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : error.code === "CONFLICT"
                ? "CONFLICT"
                : "BAD_REQUEST";

          throw new TRPCError({
            code,
            message: error.message,
          });
        }

        throw error;
      }
    }),
  cancelSchedule: protectedProcedure
    .input(z.object({ id: z.string(), rootId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await cancelSchedule({
          postId: input.id,
          rootId: input.rootId,
        });
      } catch (error) {
        if (error instanceof ScheduledPostError) {
          const code =
            error.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : error.code === "CONFLICT"
                ? "CONFLICT"
                : "BAD_REQUEST";

          throw new TRPCError({
            code,
            message: error.message,
          });
        }

        throw error;
      }
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
