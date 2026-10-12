import z from "zod";

import { ContentStatus, Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
} from "@/trpc/init";

/** How many drafts the "Bozze da pubblicare" widget lists at once. */
const DRAFT_LIST_LIMIT = 5;

const widgetInstanceSchema = z.object({
  key: z.string().min(1),
  definitionId: z.string().min(1),
  config: z.record(z.string(), z.unknown()).nullish(),
  hidden: z.boolean().optional(),
});

export const dashboardRouter = createTRPCRouter({
  /**
   * The current user's saved layout override. An empty list means "no override
   * yet", so the registry defaults apply.
   */
  getLayout: protectedProcedure.query(async ({ ctx }) => {
    const layout = await db.dashboardLayout.findUnique({
      where: { userId: ctx.auth.id },
    });

    return { widgets: layout?.widgets ?? [] };
  }),

  /**
   * Persists the current user's layout override. Affects only the current
   * user.
   */
  saveLayout: protectedProcedure
    .input(z.object({ widgets: z.array(widgetInstanceSchema) }))
    .mutation(async ({ ctx, input }) => {
      const layout = await db.dashboardLayout.upsert({
        where: { userId: ctx.auth.id },
        create: { userId: ctx.auth.id, widgets: input.widgets },
        update: { widgets: input.widgets },
      });

      return { widgets: layout.widgets };
    }),

  /**
   * Draft posts: the count and the most recently edited few, for the
   * "Bozze da pubblicare" widget.
   */
  getDrafts: permissionProcedure(PERMISSIONS.POSTS_READ).query(async () => {
    const where: Prisma.PostRootWhereInput = {
      currentVersion: { is: { status: ContentStatus.DRAFT } },
    };

    const [roots, count] = await Promise.all([
      db.postRoot.findMany({
        where,
        orderBy: { currentVersion: { updatedAt: "desc" } },
        take: DRAFT_LIST_LIMIT,
        select: {
          id: true,
          slug: true,
          currentVersion: {
            select: { id: true, title: true, updatedAt: true },
          },
        },
      }),
      db.postRoot.count({ where }),
    ]);

    const items = roots
      .map((root) => {
        const version = root.currentVersion;
        if (!version) return null;

        return {
          rootId: root.id,
          versionId: version.id,
          title: version.title,
          updatedAt: version.updatedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return { count, items };
  }),
});
