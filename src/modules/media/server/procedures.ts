import "server-only";

import z from "zod";

import { Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  mediaLibraryItem,
  mediaLibraryRowSelect,
  type MediaLibraryRow,
} from "@/modules/media/lib/media-library";

import {
  DEFAULT_MEDIA_SORT,
  DEFAULT_MEDIA_VIEW,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_MEDIA_FOLDER_NAME_LENGTH,
  MAX_PAGE_SIZE,
  MEDIA_LIBRARY_SORTS,
  MEDIA_LIBRARY_VIEWS,
  MIN_PAGE_SIZE,
  type MediaLibrarySort,
  type MediaLibraryView,
} from "../constants";

import { toMediaTrpcError } from "./errors";
import {
  createMediaFolder,
  deleteMediaFolder,
  getMediaFolderDetails,
  getMediaFolderTree,
  listMediaFolderChildren,
  updateMediaFolder,
} from "./media-folder-service";
import {
  archiveMediaBatch,
  deleteMediaPermanentlyBatch,
  MediaNotFoundError,
  moveMediaToFolder,
  restoreMediaBatch,
} from "./media-service";
import { getMediaStorageDetails } from "./media-quota";
import { pendingRehome, planRehomeRun } from "./rehome";
import { rehomeRunner } from "./rehome-runner";
import { getStorageDriverChoice, resolveActiveStorageDriver } from "./storage";

/**
 * The orders Prisma can express directly. Name is absent because Prisma has no
 * case-insensitive `orderBy`; it is paged in SQL by `listMediaIdsByName`.
 * Every order ends on the Media id so a block boundary cannot repeat or skip a
 * row that ties with the next one.
 */
const MEDIA_LIST_ORDER_BY: Record<
  Exclude<MediaLibrarySort, "name">,
  Prisma.MediaOrderByWithRelationInput[]
> = {
  created: [{ createdAt: "desc" }, { id: "asc" }],
  size: [
    // PostgreSQL sorts nulls first in descending order, and a Media with no
    // stored-file record has no size either, so both kinds of unknown go last.
    { storedFile: { size: { sort: "desc", nulls: "last" } } },
    { id: "asc" },
  ],
};

/**
 * The ids of one name-ordered block. The production database uses the `C`
 * collation, where `name ASC` puts every capital before every lowercase
 * letter, so the order reads the name under the root ICU collation instead:
 * case no longer splits the alphabet, and a name that starts with an accented
 * letter sorts beside the same letter unaccented. The conditions mirror
 * `buildMediaWhere`: a term spans the library, otherwise the active view
 * browses the open folder (or the unfiled root) and Archived is flat. The
 * block itself comes from the typed client, restored to this order.
 */
async function listMediaIdsByName({
  search,
  view,
  folderId,
  take,
  skip,
}: {
  search?: string | null;
  view: MediaLibraryView;
  folderId?: string | null;
  take: number;
  skip: number;
}): Promise<string[]> {
  const term = search?.trim();
  const conditions: Prisma.Sql[] = [
    view === "archived"
      ? Prisma.sql`"archivedAt" IS NOT NULL`
      : Prisma.sql`"archivedAt" IS NULL`,
  ];

  if (term) {
    // `ILIKE` is what Prisma's `contains` with an insensitive mode compiles
    // to, including its treatment of `%` and `_`. Matching that exactly is
    // what keeps the count and this block describing the same rows.
    conditions.push(Prisma.sql`"name" ILIKE ${`%${term}%`}`);
  } else if (view === "active") {
    conditions.push(
      folderId
        ? Prisma.sql`"folderId" = ${folderId}`
        : Prisma.sql`"folderId" IS NULL`,
    );
  }

  const rows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id"
    FROM "Media"
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY "name" COLLATE "und-x-icu" ASC, "id" ASC
    LIMIT ${take} OFFSET ${skip}
  `);

  return rows.map((row) => row.id);
}

/** One block of the filtered list, in the requested order. */
async function listMediaRows({
  where,
  sort,
  search,
  view,
  folderId,
  take,
  skip,
}: {
  where: Prisma.MediaWhereInput;
  sort: MediaLibrarySort;
  search?: string | null;
  view: MediaLibraryView;
  folderId?: string | null;
  take: number;
  skip: number;
}): Promise<MediaLibraryRow[]> {
  if (sort !== "name") {
    return db.media.findMany({
      where,
      select: mediaLibraryRowSelect,
      orderBy: MEDIA_LIST_ORDER_BY[sort],
      take,
      skip,
    });
  }

  const ids = await listMediaIdsByName({ search, view, folderId, take, skip });
  if (ids.length === 0) return [];

  const rows = await db.media.findMany({
    where: { id: { in: ids } },
    select: mediaLibraryRowSelect,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}

/**
 * The grid and the header count share this filter, so the number above the
 * grid can never disagree with the rows below it.
 */
function buildMediaWhere({
  search,
  view,
  folderId,
}: {
  search?: string | null;
  view: MediaLibraryView;
  folderId?: string | null;
}): Prisma.MediaWhereInput {
  const term = search?.trim();

  return {
    name: term ? { contains: term, mode: "insensitive" } : undefined,
    archivedAt: view === "archived" ? { not: null } : null,
    // My Drive browses one level of the tree: the open folder, or the unfiled
    // Media at the root when none is open. A search spans the library, because
    // a name is often the only thing the editor remembers; Recent and Archived
    // are whole-library views anyway, so the folder never narrows them.
    folderId:
      view === "active" && !term ? (folderId ?? null) : undefined,
  };
}

const viewInput = z
  .enum(MEDIA_LIBRARY_VIEWS)
  .default(DEFAULT_MEDIA_VIEW);

/** What both the grid and the header count: the filters that pick the rows. */
const scopeInput = z.object({
  search: z.string().nullish(),
  view: viewInput,
  /** The open folder inside My Drive; absent or null means the My Drive root. */
  folderId: z.string().min(1).nullish(),
});

const listInput = scopeInput.extend({
  /**
   * The order the grid asked for. It is deliberately not part of `scopeInput`:
   * the header count does not care about order, so a reorder must not refetch
   * the number above the grid.
   */
  sort: z.enum(MEDIA_LIBRARY_SORTS).default(DEFAULT_MEDIA_SORT),
  page: z.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z
    .number()
    .int()
    .min(MIN_PAGE_SIZE)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

const idsInput = z.object({
  ids: z.array(z.string().min(1)),
});

const folderName = z
  .string()
  .trim()
  .min(1)
  .max(MAX_MEDIA_FOLDER_NAME_LENGTH);

const createFolderInput = z.object({
  name: folderName,
  parentId: z.string().min(1).nullish(),
});

const updateFolderInput = z.object({
  id: z.string().min(1),
  name: folderName.optional(),
  parentId: z.string().min(1).nullish(),
});

const folderIdInput = z.object({ id: z.string().min(1) });

export const mediaRouter = createTRPCRouter({
  getMany: permissionProcedure(PERMISSIONS.MEDIA_READ)
    .input(listInput)
    .query(async ({ input }) => {
      const where = buildMediaWhere(input);

      // Folders belong to the first page of My Drive: they are where browsing
      // starts, not rows that repeat above every page of a folder's Media. A
      // search lists what matched, not where it could be filed, so it draws no
      // folder cards either; Recent and Archived are flat views.
      const term = input.search?.trim();
      const childFolders =
        input.view === "active" && input.page === DEFAULT_PAGE && !term
          ? listMediaFolderChildren(input.folderId ?? null)
          : Promise.resolve([]);

      const [rows, total, folders] = await Promise.all([
        listMediaRows({
          where,
          sort: input.sort,
          search: input.search,
          view: input.view,
          folderId: input.folderId,
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
        }),
        db.media.count({ where }),
        childFolders,
      ]);

      return {
        items: rows.map(mediaLibraryItem),
        folders,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  getMeta: permissionProcedure(PERMISSIONS.MEDIA_READ)
    .input(scopeInput)
    .query(async ({ input }) => {
      const where = buildMediaWhere(input);

      // The active driver answers both the choice and how many files are
      // still elsewhere; the quota and the header count stay the sources they
      // already were, so the header never grows a second arithmetic. The
      // breakdown comes from the quota's own read, so the progress bar and the
      // per-type rows can never describe different libraries.
      const storage = await getStorageDriverChoice();
      const [total, usage, rehome] = await Promise.all([
        db.media.count({ where }),
        getMediaStorageDetails(),
        pendingRehome(storage.active),
      ]);

      return {
        total,
        quota: usage.quota,
        byMediaType: usage.byMediaType,
        storage,
        rehome,
      };
    }),

  getFolderTree: permissionProcedure(PERMISSIONS.MEDIA_READ).query(() =>
    getMediaFolderTree(),
  ),

  /** What the details panel shows for one folder; null when it no longer exists. */
  getFolderDetails: permissionProcedure(PERMISSIONS.MEDIA_READ)
    .input(folderIdInput)
    .query(({ input }) => getMediaFolderDetails(input.id)),

  createFolder: permissionProcedure(PERMISSIONS.MEDIA_CREATE)
    .input(createFolderInput)
    .mutation(async ({ input }) => {
      try {
        return await createMediaFolder(input);
      } catch (error) {
        throw toMediaTrpcError(error);
      }
    }),

  /**
   * Renames a folder or changes its parent. The service refuses a move that
   * would put a folder inside itself or one of its descendants.
   */
  updateFolder: permissionProcedure(PERMISSIONS.MEDIA_UPDATE)
    .input(updateFolderInput)
    .mutation(async ({ input }) => {
      try {
        return await updateMediaFolder(input);
      } catch (error) {
        throw toMediaTrpcError(error);
      }
    }),

  deleteFolder: permissionProcedure(PERMISSIONS.MEDIA_DELETE)
    .input(folderIdInput)
    .mutation(async ({ input }) => {
      try {
        return await deleteMediaFolder(input.id);
      } catch (error) {
        throw toMediaTrpcError(error);
      }
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

  /**
   * Files one or many Media into a folder, or back to the My Drive root when
   * `folderId` is null. Archived Media are not refused: an archived row keeps
   * its folder, so the target is a fact about filing rather than visibility.
   */
  moveMedia: permissionProcedure(PERMISSIONS.MEDIA_UPDATE)
    .input(
      idsInput.extend({
        folderId: z.string().min(1).nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const moved = await moveMediaToFolder({
          mediaIds: input.ids,
          folderId: input.folderId,
        });

        return { moved };
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
