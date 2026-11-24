import "server-only";

import { db } from "@/shared/lib/db";

import { MAX_MEDIA_FOLDER_NAME_LENGTH } from "../constants";
import {
  buildFolderTree,
  wouldCreateCycle,
  type MediaFolderNode,
  type MediaFolderRow,
} from "../lib/media-folder";

/**
 * One advisory-lock key for every folder write. An update walks the parent
 * chain and then writes, and a delete counts and then deletes; without the lock
 * two concurrent folder writes can each pass their own check, which is how a
 * cycle or a delete of a just-filled folder would slip through. Media writes
 * take no lock: the foreign key refuses a row whose folder was deleted under
 * it, so no Media is ever filed into a folder that no longer exists.
 */
const MEDIA_FOLDER_LOCK_KEY = 0x4d464c44; // "MFLD"

const folderSelect = {
  id: true,
  name: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const folderRowSelect = {
  id: true,
  name: true,
  parentId: true,
} as const;

type FolderReadClient = Pick<typeof db, "mediaFolder">;

export class MediaFolderNotFoundError extends Error {
  constructor(id: string) {
    super(`Media folder ${id} was not found.`);
    this.name = "MediaFolderNotFoundError";
  }
}

export class MediaFolderNameError extends Error {
  constructor() {
    super(
      `A Media folder name must be between 1 and ${MAX_MEDIA_FOLDER_NAME_LENGTH} characters.`,
    );
    this.name = "MediaFolderNameError";
  }
}

export class MediaFolderCycleError extends Error {
  constructor() {
    super(
      "A folder cannot be moved inside itself or one of its descendants.",
    );
    this.name = "MediaFolderCycleError";
  }
}

export class MediaFolderNotEmptyError extends Error {
  constructor({
    mediaCount,
    childCount,
  }: {
    mediaCount: number;
    childCount: number;
  }) {
    const contents = [
      mediaCount > 0 ? `${mediaCount} Media` : null,
      childCount > 0
        ? `${childCount} ${childCount === 1 ? "subfolder" : "subfolders"}`
        : null,
    ].filter(Boolean);

    super(
      `This folder still contains ${contents.join(" and ")}. Empty it before deleting it.`,
    );
    this.name = "MediaFolderNotEmptyError";
  }
}

/** Trims a name and refuses one no branch of the tree could show. */
function normalizedFolderName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed || trimmed.length > MAX_MEDIA_FOLDER_NAME_LENGTH) {
    throw new MediaFolderNameError();
  }

  return trimmed;
}

async function allFoldersFlat(
  client: FolderReadClient = db,
): Promise<MediaFolderRow[]> {
  return client.mediaFolder.findMany({ select: folderRowSelect });
}

/**
 * Refuses a target that no folder backs before anything is written into it.
 * The foreign key would refuse the row too, but only after an upload has paid
 * to store the file, and the refusal would read as a storage failure.
 */
export async function assertMediaFolderExists(folderId: string): Promise<void> {
  const folder = await db.mediaFolder.findUnique({
    where: { id: folderId },
    select: { id: true },
  });

  if (!folder) throw new MediaFolderNotFoundError(folderId);
}

/** The whole hierarchy, nested and ordered, rooted at the implicit My Drive. */
export async function getMediaFolderTree(): Promise<MediaFolderNode[]> {
  return buildFolderTree(await allFoldersFlat());
}

export async function createMediaFolder(input: {
  name: string;
  parentId?: string | null;
}) {
  const name = normalizedFolderName(input.name);
  const parentId = input.parentId ?? null;

  if (parentId) await assertMediaFolderExists(parentId);

  return db.mediaFolder.create({
    data: { name, parentId },
    select: folderSelect,
  });
}

export async function updateMediaFolder(input: {
  id: string;
  name?: string;
  parentId?: string | null;
}) {
  const name =
    input.name === undefined ? undefined : normalizedFolderName(input.name);

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${MEDIA_FOLDER_LOCK_KEY})`;

    const rows = await allFoldersFlat(tx);
    const existing = rows.find((row) => row.id === input.id);

    if (!existing) {
      throw new MediaFolderNotFoundError(input.id);
    }

    if (input.parentId !== undefined) {
      if (
        input.parentId !== null &&
        !rows.some((row) => row.id === input.parentId)
      ) {
        throw new MediaFolderNotFoundError(input.parentId);
      }

      if (wouldCreateCycle(rows, input.id, input.parentId)) {
        throw new MediaFolderCycleError();
      }
    }

    return tx.mediaFolder.update({
      where: { id: input.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
      select: folderSelect,
    });
  });
}

/**
 * Deleting a folder is refused while it holds anything: the service checks the
 * two relations and the foreign keys would refuse the row anyway, so neither a
 * request path nor a future caller can strand organized Media.
 */
export async function deleteMediaFolder(id: string) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${MEDIA_FOLDER_LOCK_KEY})`;

    const existing = await tx.mediaFolder.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new MediaFolderNotFoundError(id);
    }

    const [mediaCount, childCount] = await Promise.all([
      tx.media.count({ where: { folderId: id } }),
      tx.mediaFolder.count({ where: { parentId: id } }),
    ]);

    if (mediaCount > 0 || childCount > 0) {
      throw new MediaFolderNotEmptyError({ mediaCount, childCount });
    }

    await tx.mediaFolder.delete({ where: { id } });

    return { id };
  });
}
