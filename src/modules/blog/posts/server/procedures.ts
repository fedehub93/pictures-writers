import z from "zod";
import { db } from "@/shared/lib/db";
import { revalidateContent } from "@/shared/lib/revalidate-content";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { ContentStatus, type Prisma } from "@/generated/prisma";

import {
  buildListOrderBy,
  sortByDefaultOrder,
} from "@/shared/lib/list-sorting";

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

import { createPost } from "../lib/create-post";
import { deletePostRoot } from "../lib/delete-post";
import { toPostTrpcError } from "../lib/errors";
import {
  publishPost,
  PublishPostError,
  unpublishPostVersion,
} from "../lib/publish-post";
import { savePostVersion } from "../lib/save-post";
import { updatePostVersionSeo } from "../lib/update-seo";
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
      return await createPost({
        title: input.title,
        slug: input.slug,
        scheduledAt: input.scheduledAt,
        timezone: input.timezone,
        userId: ctx.auth.id,
      });
    }),

  update: protectedProcedure
    .input(postUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        return await savePostVersion(input);
      } catch (error) {
        throw toPostTrpcError(error);
      }
    }),

  updateSeo: protectedProcedure
    .input(postUpdateSeoSchema)
    .mutation(async ({ input }) => {
      try {
        return await updatePostVersionSeo(input);
      } catch (error) {
        throw toPostTrpcError(error);
      }
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const root =
          (await db.postRoot.findUnique({
            where: { id: input.id },
            select: { id: true },
          })) ??
          (await db.postVersion.findUnique({
            where: { id: input.id },
            select: { rootId: true },
          }).then((version) =>
            version ? { id: version.rootId } : null,
          ));

        if (!root) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        const deleted = await deletePostRoot({ rootId: root.id });

        revalidateContent("post", deleted.slug);

        return deleted;
      } catch (error) {
        throw toPostTrpcError(error, {
          internalMessage: "Error deleting post.",
        });
      }
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

  getVersions: protectedProcedure
    .input(z.object({ rootId: z.string() }))
    .query(async ({ input }) => {
      return await db.postVersion.findMany({
        where: { rootId: input.rootId },
        orderBy: { version: "desc" },
        select: {
          id: true,
          version: true,
          title: true,
          status: true,
          publishedAt: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
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
          id: input.id,
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

  unpublish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const unpublished = await unpublishPostVersion({ id: input.id });

        revalidateContent("post", unpublished.slug);

        return unpublished;
      } catch (error) {
        if (error instanceof PublishPostError) {
          throw new TRPCError({
            code: error.code === "NOT_FOUND" ? "NOT_FOUND" : "BAD_REQUEST",
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
});
