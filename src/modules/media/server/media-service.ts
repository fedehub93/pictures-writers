import "server-only";

import { randomUUID } from "node:crypto";

import { MediaType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import {
  buildMediaDeliveryUrl,
  withMediaDeliveryArchived,
} from "@/modules/media/lib/manifest";
import {
  mediaLibrarySelect,
  type MediaLibraryItem,
} from "@/modules/media/lib/media-library";
import type { MediaRendition } from "@/modules/media/types";

import { checksumOf } from "./image-bytes";
import { countMediaReferencesFor } from "./media-usage";
import { generateRenditions, normaliseImage } from "./process-image";
import type { StorageDriver } from "./storage";

export interface MediaUploadSource {
  key: string | null;
  url: string;
  name: string;
  type: MediaType;
  altText?: string | null;
  mimeType?: string | null;
  size?: number | null;
}

export interface CreateMediaFromUploadOptions {
  driver: StorageDriver;
  source: MediaUploadSource;
  /** Explicit admin override: keep the duplicate and create a second row. */
  override?: boolean;
}

/**
 * Only the uploaded object and its MIME are needed: a replacement never
 * changes the Media's identity, name or type.
 */
export interface MediaReplacementSource {
  key: string;
  mimeType?: string | null;
}

export interface ReplaceMediaFileOptions {
  driver: StorageDriver;
  mediaId: string;
  source: MediaReplacementSource;
}

export class DuplicateMediaError extends Error {
  constructor(readonly existing: MediaLibraryItem) {
    super(`A media with the same checksum already exists: "${existing.id}"`);
    this.name = "DuplicateMediaError";
  }
}

export class MediaProcessingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MediaProcessingError";
  }
}

export class MediaNotFoundError extends Error {
  constructor(readonly mediaId: string) {
    super(`Media not found: "${mediaId}"`);
    this.name = "MediaNotFoundError";
  }
}

export class MediaNotArchivedError extends Error {
  constructor(readonly mediaId: string) {
    super(
      "Only archived media can be permanently deleted. Archive it first.",
    );
    this.name = "MediaNotArchivedError";
  }
}

export class MediaInUseError extends Error {
  constructor(
    readonly mediaId: string,
    readonly usage: number,
  ) {
    super(
      `This media is referenced by ${usage} content ${
        usage === 1 ? "item" : "items"
      }. Remove those references before deleting it. References embedded in rich text or page data are not counted.`,
    );
    this.name = "MediaInUseError";
  }
}

function findDuplicate(checksum: string): Promise<MediaLibraryItem | null> {
  return db.media.findFirst({
    where: { checksum, archivedAt: null },
    select: mediaLibrarySelect,
    orderBy: { createdAt: "asc" },
  });
}

function revisionPrefix(mediaId: string, revision: number): string {
  return `${mediaId}/${revision}/`;
}

async function createPlainMedia(
  source: MediaUploadSource,
): Promise<MediaLibraryItem> {
  return db.media.create({
    data: {
      name: source.name,
      key: source.key,
      url: source.url,
      size: source.size ?? null,
      type: source.type,
      altText: source.altText || null,
      mimeType: source.mimeType || null,
    },
    select: mediaLibrarySelect,
  });
}

interface StoredImageVersion {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  metadata: PrismaJson.MediaMetadata;
  renditions: MediaRendition[];
}

interface StoredPlainVersion {
  key: string;
  url: string;
  size: number;
  mimeType: string | null;
}

async function writeImageVersion({
  driver,
  id,
  revision,
  bytes,
  archived,
}: {
  driver: StorageDriver;
  id: string;
  revision: number;
  bytes: Uint8Array<ArrayBuffer>;
  archived: boolean;
}): Promise<StoredImageVersion> {
  const prefix = revisionPrefix(id, revision);

  try {
    const image = await normaliseImage(bytes);
    const generated = await generateRenditions(image);
    const originalKey = `${prefix}original`;

    await driver.put(originalKey, image.bytes, image.mimeType);

    const manifest: MediaRendition[] = [];
    for (const rendition of generated) {
      const key = `${prefix}${rendition.width}.${rendition.format}`;
      await driver.put(key, rendition.bytes, `image/${rendition.format}`);

      manifest.push({
        key,
        width: rendition.width,
        height: rendition.height,
        bytes: rendition.bytes.byteLength,
        format: rendition.format,
      });
    }

    const originalUrl = await driver.url(originalKey);
    const renditionUrls = await Promise.all(
      manifest.map((rendition) => driver.url(rendition.key)),
    );
    const url = buildMediaDeliveryUrl(originalUrl, {
      revision,
      archived,
      renditions: manifest.map((rendition, index) => ({
        width: rendition.width,
        format: rendition.format,
        url: renditionUrls[index],
      })),
    });

    return {
      key: originalKey,
      url,
      size: image.bytes.byteLength,
      mimeType: image.mimeType,
      metadata: image.metadata as PrismaJson.MediaMetadata,
      renditions: manifest,
    };
  } catch (error) {
    await driver.deletePrefix(prefix).catch(() => undefined);
    throw error;
  }
}

async function writePlainVersion({
  driver,
  id,
  revision,
  bytes,
  mimeType,
}: {
  driver: StorageDriver;
  id: string;
  revision: number;
  bytes: Uint8Array<ArrayBuffer>;
  mimeType: string | null;
}): Promise<StoredPlainVersion> {
  const prefix = revisionPrefix(id, revision);
  const key = `${prefix}original`;

  try {
    await driver.put(key, bytes, mimeType ?? "application/octet-stream");

    return {
      key,
      url: await driver.url(key),
      size: bytes.byteLength,
      mimeType,
    };
  } catch (error) {
    await driver.deletePrefix(prefix).catch(() => undefined);
    throw error;
  }
}

function storedImageFields(
  stored: StoredImageVersion,
  revision: number,
  checksum: string,
) {
  return {
    key: stored.key,
    url: stored.url,
    size: stored.size,
    type: MediaType.IMAGE,
    mimeType: stored.mimeType,
    checksum,
    revision,
    metadata: stored.metadata,
    renditions: stored.renditions as PrismaJson.MediaRenditions,
  };
}

/**
 * Turns an uploaded object into a Media.
 *
 * Images are downloaded once, normalised, cut into the full rendition ladder
 * and written under `<mediaId>/<revision>/`. The Media row is only created
 * after every object exists, and a failure removes the whole prefix so the
 * library never holds a half-processed file. Other media types keep the
 * historical behaviour: the uploaded object is recorded, never copied.
 */
export async function createMediaFromUpload({
  driver,
  source,
  override = false,
}: CreateMediaFromUploadOptions): Promise<MediaLibraryItem> {
  if (source.type !== MediaType.IMAGE) {
    return createPlainMedia(source);
  }

  if (!source.key) {
    throw new MediaProcessingError(
      "The uploaded image cannot be processed because its storage key is missing.",
    );
  }

  let originalBytes: Uint8Array<ArrayBuffer>;
  try {
    originalBytes = await driver.get(source.key);
  } catch (error) {
    throw new MediaProcessingError(
      "The uploaded file could not be read from storage.",
      { cause: error },
    );
  }

  const checksum = checksumOf(originalBytes);

  if (!override) {
    const existing = await findDuplicate(checksum);
    if (existing) throw new DuplicateMediaError(existing);
  }

  const id = randomUUID();
  const revision = 1;
  const prefix = `${id}/`;

  try {
    const stored = await writeImageVersion({
      driver,
      id,
      revision,
      bytes: originalBytes,
      archived: false,
    });

    const media = await db.media.create({
      data: {
        ...storedImageFields(stored, revision, checksum),
        id,
        name: source.name,
        altText: source.altText || null,
      },
      select: mediaLibrarySelect,
    });

    // The uploaded object was only the processing input. Best-effort removal
    // keeps the storage tier clean; legacy UploadThing file keys are not
    // addressable by customId and simply stay behind.
    if (!source.key.startsWith(prefix)) {
      await driver.delete(source.key).catch(() => undefined);
    }

    return media;
  } catch (error) {
    await driver.deletePrefix(prefix).catch(() => undefined);

    if (error instanceof MediaProcessingError) throw error;

    throw new MediaProcessingError(
      "The image could not be processed. Nothing was added to the library.",
      { cause: error },
    );
  }
}

/**
 * Replaces the bytes of an existing Media without changing its identity.
 *
 * The new revision is written under `<mediaId>/<revision>/` first, the row is
 * updated, and only then the previous revision's prefix is removed. A failure
 * before the row update deletes only the new prefix, so the old bytes remain
 * delivered exactly as before.
 */
export async function replaceMediaFile({
  driver,
  mediaId,
  source,
}: ReplaceMediaFileOptions): Promise<MediaLibraryItem> {
  const existing = await db.media.findUnique({ where: { id: mediaId } });

  if (!existing) throw new MediaNotFoundError(mediaId);

  if (!source.key) {
    throw new MediaProcessingError(
      "The replacement file cannot be processed because its storage key is missing.",
    );
  }

  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = await driver.get(source.key);
  } catch (error) {
    throw new MediaProcessingError(
      "The replacement file could not be read from storage.",
      { cause: error },
    );
  }

  const revision = existing.revision + 1;
  const mediaPrefix = `${mediaId}/`;
  const newPrefix = revisionPrefix(mediaId, revision);
  const previousPrefix = revisionPrefix(mediaId, existing.revision);
  const checksum = checksumOf(bytes);

  let media: MediaLibraryItem;

  try {
    if (existing.type === MediaType.IMAGE) {
      const stored = await writeImageVersion({
        driver,
        id: mediaId,
        revision,
        bytes,
        archived: existing.archivedAt !== null,
      });

      media = await db.media.update({
        where: { id: mediaId },
        data: storedImageFields(stored, revision, checksum),
        select: mediaLibrarySelect,
      });
    } else {
      const stored = await writePlainVersion({
        driver,
        id: mediaId,
        revision,
        bytes,
        mimeType: source.mimeType || existing.mimeType,
      });

      media = await db.media.update({
        where: { id: mediaId },
        data: {
          key: stored.key,
          url: stored.url,
          size: stored.size,
          mimeType: stored.mimeType,
          checksum,
          revision,
          metadata: null,
          renditions: null,
        },
        select: mediaLibrarySelect,
      });
    }
  } catch (error) {
    await driver.deletePrefix(newPrefix).catch(() => undefined);

    if (error instanceof MediaProcessingError) throw error;

    throw new MediaProcessingError(
      "The file could not be replaced. The previous version is still in place.",
      { cause: error },
    );
  }

  // The row already points at the new revision, so a cleanup hiccup must not
  // turn a successful replacement into a reported failure. The objects are no
  // longer reachable from any Media URL.
  await driver.deletePrefix(previousPrefix).catch((error) => {
    console.error("[MEDIA_REPLACE] Could not remove the previous revision", error);
  });

  // Media created before the storage seam keep their original at the legacy
  // upload key rather than under the prefix. Best-effort removal stops the old
  // bytes from being served, but legacy UploadThing file keys are not
  // addressable by customId and simply stay behind.
  if (existing.key && !existing.key.startsWith(mediaPrefix)) {
    await driver.delete(existing.key).catch(() => undefined);
  }

  // The uploaded object was only the processing input.
  if (!source.key.startsWith(mediaPrefix)) {
    await driver.delete(source.key).catch(() => undefined);
  }

  return media;
}

/**
 * Hides a Media from the library without touching its bytes or references.
 * Archived media keep being served (the loader falls back to the original),
 * which is why archiving is reversible and never clears a cover.
 */
export async function archiveMedia(mediaId: string): Promise<MediaLibraryItem> {
  const existing = await db.media.findUnique({ where: { id: mediaId } });

  if (!existing) throw new MediaNotFoundError(mediaId);
  if (existing.archivedAt) {
    return db.media.findUniqueOrThrow({
      where: { id: mediaId },
      select: mediaLibrarySelect,
    });
  }

  return db.media.update({
    where: { id: mediaId },
    data: {
      archivedAt: new Date(),
      url: withMediaDeliveryArchived(existing.url, true),
    },
    select: mediaLibrarySelect,
  });
}

/**
 * Brings an archived Media back into the library and re-enables its
 * renditions.
 */
export async function restoreMedia(mediaId: string): Promise<MediaLibraryItem> {
  const existing = await db.media.findUnique({ where: { id: mediaId } });

  if (!existing) throw new MediaNotFoundError(mediaId);
  if (!existing.archivedAt) {
    return db.media.findUniqueOrThrow({
      where: { id: mediaId },
      select: mediaLibrarySelect,
    });
  }

  return db.media.update({
    where: { id: mediaId },
    data: {
      archivedAt: null,
      url: withMediaDeliveryArchived(existing.url, false),
    },
    select: mediaLibrarySelect,
  });
}

export interface DeleteMediaPermanentlyOptions {
  driver: StorageDriver;
  mediaId: string;
}

export interface DeleteMediaPermanentlyBatchOptions {
  driver: StorageDriver;
  mediaIds: string[];
}

/**
 * Permanently removes archived Media.
 *
 * Every id is validated before anything is touched: an active Media or one
 * still referenced by content aborts the whole batch, so a selected cover is
 * never cleared silently. Storage is deleted before the rows, and every object
 * lives under `<mediaId>/`, which makes the prefix the unit of cleanup.
 */
export async function deleteMediaPermanentlyBatch({
  driver,
  mediaIds,
}: DeleteMediaPermanentlyBatchOptions): Promise<number> {
  const uniqueIds = [...new Set(mediaIds)];
  if (uniqueIds.length === 0) return 0;

  const media = await db.media.findMany({
    where: { id: { in: uniqueIds } },
  });

  const found = new Set(media.map((item) => item.id));
  const missing = uniqueIds.find((id) => !found.has(id));
  if (missing) throw new MediaNotFoundError(missing);

  const active = media.find((item) => item.archivedAt === null);
  if (active) throw new MediaNotArchivedError(active.id);

  const usage = await countMediaReferencesFor(uniqueIds);
  const referenced = uniqueIds.find((id) => (usage.get(id) ?? 0) > 0);
  if (referenced) {
    throw new MediaInUseError(referenced, usage.get(referenced) ?? 0);
  }

  for (const item of media) {
    const prefix = `${item.id}/`;

    try {
      await driver.deletePrefix(prefix);
    } catch (error) {
      throw new MediaProcessingError(
        "The stored objects could not be removed. Nothing was deleted.",
        { cause: error },
      );
    }

    // Media created before the storage seam keep their original outside the
    // Media prefix. Legacy UploadThing file keys are not addressable by
    // customId, so a failure here only leaves that legacy object behind.
    if (item.key && !item.key.startsWith(prefix)) {
      await driver.delete(item.key).catch((error) => {
        console.error(
          "[MEDIA_DELETE] Could not remove the legacy original",
          error,
        );
      });
    }
  }

  await db.media.deleteMany({ where: { id: { in: uniqueIds } } });

  return uniqueIds.length;
}

export async function deleteMediaPermanently({
  driver,
  mediaId,
}: DeleteMediaPermanentlyOptions): Promise<void> {
  await deleteMediaPermanentlyBatch({ driver, mediaIds: [mediaId] });
}
