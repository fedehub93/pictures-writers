import z from "zod";
import { db } from "@/shared/lib/db";
import { revalidateContent } from "@/shared/lib/revalidate-content";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import {
  ContentStatus,
  ScheduledActionType,
  type Prisma,
} from "@/generated/prisma";

import { createPostSeo } from "@/lib/seo";
import {
  buildListOrderBy,
  sortByDefaultOrder,
} from "@/shared/lib/list-sorting";
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
  POST_LIST_SORTS,
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
    .input(postInsertSchema.extend({ timezone: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { timezone, ...postData } = input;
      const isScheduled = input.scheduledAt && input.scheduledAt > new Date();
      const status = isScheduled
        ? ContentStatus.SCHEDULED
        : ContentStatus.DRAFT;
      const post = await db.post.create({
        data: {
          ...postData,
          version: 1,
          status,
          scheduledAt: input.scheduledAt,
          preSchedulingStatus:
            status === ContentStatus.SCHEDULED ? ContentStatus.DRAFT : null,
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
            timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      const root = await db.postRoot.findUnique({
        where: {
          id: input.id,
        },
        include: {
          currentVersion: {
            include: {
              seo: true,
              categories: {
                select: {
                  category: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
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
                },
              },
              imageCover: true,
              authors: {
                select: {
                  user: true,
                  sort: true,
                },
                orderBy: {
                  sort: "asc",
                },
              },
              faqs: {
                select: {
                  id: true,
                  question: true,
                  answer: true,
                  sort: true,
                },
                orderBy: {
                  sort: "asc",
                },
              },
            },
          },
        },
      });

      if (!root || !root.currentVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return {
        ...root.currentVersion,
        rootId: root.id,
        slug: root.slug,
        firstPublishedAt: root.firstPublishedAt,
      };
    }),
  getLastByRootId: protectedProcedure
    .input(z.object({ rootId: z.string() }))
    .query(async ({ input }) => {
      const root = await db.postRoot.findUnique({
        where: {
          id: input.rootId,
        },
        include: {
          currentVersion: {
            include: {
              seo: true,
              categories: {
                select: {
                  category: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
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
                },
              },
              imageCover: true,
              authors: {
                select: {
                  user: true,
                  sort: true,
                },
                orderBy: {
                  sort: "asc",
                },
              },
              faqs: {
                select: {
                  id: true,
                  question: true,
                  answer: true,
                  sort: true,
                },
                orderBy: {
                  sort: "asc",
                },
              },
            },
          },
        },
      });

      if (!root || !root.currentVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return {
        ...root.currentVersion,
        rootId: root.id,
        slug: root.slug,
        firstPublishedAt: root.firstPublishedAt,
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
            ContentStatus.SCHEDULED,
          ])
          .nullish(),
        sort: z.enum(POST_LIST_SORTS).nullish(),
        direction: z.enum(["asc", "desc"]).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const where: Prisma.PostRootWhereInput = {
        currentVersion: {
          is: {
            title: input.search
              ? { contains: input.search, mode: "insensitive" }
              : undefined,
            status: input.status ? { in: [input.status] } : undefined,
          },
        },
      };

      const include = {
        currentVersion: {
          include: {
            imageCover: {
              select: {
                url: true,
                altText: true,
              },
            },
            authors: {
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
        },
      } satisfies Prisma.PostRootInclude;

      const mapItem = (
        root: Prisma.PostRootGetPayload<{ include: typeof include }>,
      ) => {
        const version = root.currentVersion;
        if (!version) return null;

        return {
          id: version.id,
          rootId: root.id,
          title: version.title,
          slug: root.slug,
          status: version.status,
          publishedAt: version.publishedAt,
          firstPublishedAt: root.firstPublishedAt,
          scheduledAt: version.scheduledAt,
          version: version.version,
          imageCover: version.imageCover,
          authors: version.authors,
        };
      };

      const orderBy = buildListOrderBy<Prisma.PostRootOrderByWithRelationInput>({
        sort: input.sort,
        direction: input.direction,
        sortable: POST_LIST_SORTS,
        relation: "currentVersion",
      });

      if (orderBy) {
        const [roots, total] = await Promise.all([
          db.postRoot.findMany({
            where,
            include,
            orderBy,
            take: input.pageSize,
            skip: (input.page - 1) * input.pageSize,
          }),
          db.postRoot.count({ where }),
        ]);

        const items = roots
          .map(mapItem)
          .filter((item): item is NonNullable<typeof item> => item !== null);

        return {
          items,
          total,
          totalPages: Math.ceil(total / input.pageSize),
        };
      }

      const roots = await db.postRoot.findMany({ where, include });

      const rows = roots
        .map((root) => {
          const version = root.currentVersion;
          if (!version) return null;

          return {
            // Sort on the logical post: the default tie-breaker is the root id,
            // matching the explicit `{ id: "asc" }` order used below.
            id: root.id,
            title: version.title,
            status: version.status,
            publishedAt: version.publishedAt,
            root,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      const total = rows.length;
      const totalPages = Math.ceil(total / input.pageSize);

      const items = sortByDefaultOrder(rows)
        .slice((input.page - 1) * input.pageSize, input.page * input.pageSize)
        .map(({ root }) => mapItem(root))
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return { items, total, totalPages };
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
      const roots = await db.postRoot.findMany({
        where: {
          id: { in: input.ids },
          liveVersion: { isNot: null },
        },
        include: {
          liveVersion: {
            select: {
              id: true,
              title: true,
              imageCover: { select: { url: true } },
            },
          },
        },
      });

      return roots.map((root) => ({
        id: root.liveVersion!.id,
        rootId: root.id,
        title: root.liveVersion!.title,
        imageCover: root.liveVersion!.imageCover,
        slug: root.slug,
      }));
    }),
  publish: protectedProcedure
    .input(z.object({ id: z.string(), rootId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const published = await publishPost({
          postId: input.id,
          rootId: input.rootId,
        });

        revalidateContent("post", published.slug);

        return published;
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

      revalidateContent("post", unpublishedPost.slug);

      return unpublishedPost;
    }),
});
