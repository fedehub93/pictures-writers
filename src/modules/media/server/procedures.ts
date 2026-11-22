import "server-only";

import z from "zod";

import type { Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  mediaLibraryItem,
  mediaLibraryRowSelect,
} from "@/modules/media/lib/media-library";

import {
  DEFAULT_MEDIA_VIEW,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MEDIA_LIBRARY_VIEWS,
  MIN_PAGE_SIZE,
  type MediaLibraryView,
} from "../constants";

import { toMediaTrpcError } from "./errors";
import {
  archiveMediaBatch,
  deleteMediaPermanentlyBatch,
  MediaNotFoundError,
  restoreMediaBatch,
} from "./media-service";
import { getMediaQuotaStatus } from "./media-quota";
import { countMediaReferencesFor } from "./media-usage";
import { pendingRehome, planRehomeRun } from "./rehome";
import { rehomeRunner } from "./rehome-runner";
import { getStorageDriverChoice, resolveActiveStorageDriver } from "./storage";

const MEDIA_LIST_ORDER_BY: Prisma.MediaOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "asc" },
];

/**
 * The grid and the header count share this filter, so the number above the
 * grid can never disagree with the rows below it.
 */
function buildMediaWhere({
  search,
  view,
}: {
  search?: string | null;
  view: MediaLibraryView;
}): Prisma.MediaWhereInput {
  const term = search?.trim();

  return {
    name: term ? { contains: term, mode: "insensitive" } : undefined,
    archivedAt: view === "archived" ? { not: null } : null,
  };
}

const viewInput = z
  .enum(MEDIA_LIBRARY_VIEWS)
  .default(DEFAULT_MEDIA_VIEW);

const listInput = z.object({
  page: z.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z
    .number()
    .int()
    .min(MIN_PAGE_SIZE)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  search: z.string().nullish(),
  view: viewInput,
});

const idsInput = z.object({
  ids: z.array(z.string().min(1)),
});

export const mediaRouter = createTRPCRouter({
  getMany: permissionProcedure(PERMISSIONS.MEDIA_READ)
    .input(listInput)
    .query(async ({ input }) => {
      const where = buildMediaWhere(input);

      const [rows, total] = await Promise.all([
        db.media.findMany({
          where,
          // The storage facts the admin sees come from the stored-file record;
          // the Media's own columns are only the address and the archive state.
          select: mediaLibraryRowSelect,
          orderBy: MEDIA_LIST_ORDER_BY,
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
        }),
        db.media.count({ where }),
      ]);

      const usage = await countMediaReferencesFor(rows.map((row) => row.id));

      return {
        items: rows.map((row) => ({
          ...mediaLibraryItem(row),
          usageCount: usage.get(row.id) ?? 0,
        })),
        total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  getMeta: permissionProcedure(PERMISSIONS.MEDIA_READ)
    .input(
      z.object({
        search: z.string().nullish(),
        view: viewInput,
      }),
    )
    .query(async ({ input }) => {
      const where = buildMediaWhere(input);

      // The active driver answers both the choice and how many files are
      // still elsewhere; the quota and the header count stay the sources they
      // already were, so the header never grows a second arithmetic.
      const storage = await getStorageDriverChoice();
      const [total, quota, rehome] = await Promise.all([
        db.media.count({ where }),
        getMediaQuotaStatus(),
        pendingRehome(storage.active),
      ]);

      return { total, quota, storage, rehome };
    }),

  update: permissionProcedure(PERMISSIONS.MEDIA_UPDATE)
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        altText: z.string().nullish(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db.media.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!existing) {
        throw toMediaTrpcError(new MediaNotFoundError(input.id));
      }

      // Only the editable identity fields: the old REST update spread the
      // whole body, which let a caller rewrite url, key or archivedAt.
      const updated = await db.media.update({
        where: { id: input.id },
        data: {
          name: input.name,
          altText: input.altText || null,
        },
        select: mediaLibraryRowSelect,
      });

      return mediaLibraryItem(updated);
    }),

  archive: permissionProcedure(PERMISSIONS.MEDIA_UPDATE)
    .input(idsInput)
    .mutation(async ({ input }) => {
      try {
        return await archiveMediaBatch(input.ids);
      } catch (error) {
        throw toMediaTrpcError(error);
      }
    }),

  restore: permissionProcedure(PERMISSIONS.MEDIA_UPDATE)
    .input(idsInput)
    .mutation(async ({ input }) => {
      try {
        return await restoreMediaBatch(input.ids);
      } catch (error) {
        throw toMediaTrpcError(error);
      }
    }),

  removeMany: permissionProcedure(PERMISSIONS.MEDIA_DELETE)
    .input(idsInput)
    .mutation(async ({ input }) => {
      try {
        // Delete through the driver the library reports, so a choice saved in
        // Settings is honoured even when the environment variable is unset.
        // Each row's objects are still removed through the driver recorded on
        // that row, so a mixed library is cleaned on both sides.
        const active = await resolveActiveStorageDriver();

        return await deleteMediaPermanentlyBatch({
          active,
          mediaIds: input.ids,
        });
      } catch (error) {
        throw toMediaTrpcError(error);
      }
    }),

  /**
   * The space the next move needs, without writing anything. The library asks
   * before it offers the move, so the warning the admin reads is the check
   * the server enforces.
   */
  rehomePlan: permissionProcedure(PERMISSIONS.MEDIA_READ).query(async () => {
    try {
      return await planRehomeRun();
    } catch (error) {
      throw toMediaTrpcError(error);
    }
  }),

  /** The current or last run's progress. The library polls it while running. */
  rehomeStatus: permissionProcedure(PERMISSIONS.MEDIA_READ).query(() =>
    rehomeRunner.getState(),
  ),

  /**
   * Starts the move and returns immediately: copying a library takes longer
   * than a request, so progress is read through `rehomeStatus`. A warning
   * plan needs `confirmed`; an impossible one is refused here.
   */
  rehomeStart: permissionProcedure(PERMISSIONS.MEDIA_UPDATE)
    .input(z.object({ confirmed: z.boolean().default(false) }))
    .mutation(async ({ input }) => {
      try {
        return await rehomeRunner.start({ confirmed: input.confirmed });
      } catch (error) {
        throw toMediaTrpcError(error);
      }
    }),

  /**
   * Stops at the next file boundary. The file being copied finishes, so a
   * stop never leaves a half-written object or a record pointing at bytes
   * that are not there.
   */
  rehomeStop: permissionProcedure(PERMISSIONS.MEDIA_UPDATE).mutation(() =>
    rehomeRunner.stop(),
  ),
});
