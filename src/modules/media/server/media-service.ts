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
import { mediaUsageBytes } from "@/modules/media/lib/quota";
import { parseStorageDriver } from "@/modules/media/lib/storage-driver";
import { mediaPath, mediaSourceKey } from "@/modules/media/lib/url";
import type {
  MediaCleanupStatus,
  MediaDeletionCleanup,
  MediaRendition,
} from "@/modules/media/types";

import { checksumOf } from "./image-bytes";
import {
  mediaKeyDirectory,
  mediaRevisionPrefix,
  mediaStoragePrefix,
  mediaStoragePrefixForKey,
} from "./media-key";
import {
  MediaQuotaExceededError,
  withMediaQuotaAdmission,
} from "./media-quota";
import { countMediaReferencesFor } from "./media-usage";
import { generateRenditions, normaliseImage } from "./process-image";
import {
  getInstallationSlug,
  recordedStorageDriverName,
  resolveActiveStorageDriver,
  resolveMediaStorageDriver,
  StorageObjectNotFoundError,
  type ResolvedStorageDriver,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";
import type { StorageDriver } from "./storage/types";
import {
  createStoredFileForMedia,
  mediaStoredFileCreateData,
  remoteUrlForAddress,
  remoteUrlForUpload,
} from "./stored-file";

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
  /** The driver that wrote this file. Defaults to the active driver. */
  storageDriver?: StorageDriverName;
  source: MediaUploadSource;
  /** Explicit admin override: keep the duplicate and create a second row. */
  override?: boolean;
  /**
   * Whether `source.key` is a temporary object written through this driver by
   * the application transport. When true, a non-image is copied under its own
   * revision and the row records the driver; when false, the legacy provider
   * upload is recorded exactly as before.
   */
  storeUploadedObject?: boolean;
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
  /** The driver that wrote the replacement bytes. */
  storageDriver: StorageDriverName;
  mediaId: string;
  source: MediaReplacementSource;
  /** Resolves the driver recorded on the row; defaults to the process env. */
  env?: StorageEnvironment;
}

/**
 * What happened to the objects of the revision the row pointed at before the
 * replacement. "skipped" means the driver recorded on the row is not
 * configured on this instance, so its bytes were deliberately left in place.
 */
export interface ReplaceMediaFileResult {
  media: MediaLibraryItem;
  previousRevisionCleanup: MediaCleanupStatus;
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

/**
 * Errors whose meaning must survive the catch that cleans up after a failed
 * write. Wrapping the quota refusal would turn "delete some media" into a
 * generic processing failure.
 */
function isRethrowableMediaError(
  error: unknown,
): error is MediaProcessingError | MediaQuotaExceededError {
  return (
    error instanceof MediaProcessingError ||
    error instanceof MediaQuotaExceededError
  );
}

/**
 * The driver name a Media row records. A new upload defaults to the active
 * driver, resolved at call time so a choice saved in the media library is
 * honoured without a restart.
 */
async function recordedStorageDriver(
  storageDriver?: StorageDriverName,
): Promise<StorageDriverName> {
  return storageDriver ?? (await resolveActiveStorageDriver()).name;
}

async function createPlainMedia(
  source: MediaUploadSource,
): Promise<MediaLibraryItem> {
  if (source.size == null) {
    throw new MediaProcessingError(
      "The uploaded file size is required so it can be counted against the media quota.",
    );
  }

  const size = source.size;
  // A Media without a readable location could never be served or audited, so
  // the legacy branch refuses it rather than creating a row nothing can find.
  const key = mediaSourceKey({ key: source.key, url: source.url });

  if (!key) {
    throw new MediaProcessingError(
      "The uploaded file cannot be recorded because its storage key is missing.",
    );
  }

  return withMediaQuotaAdmission(
    { incomingBytes: size },
    async (tx) => {
      const media = await tx.media.create({
        data: {
          name: source.name,
          key: source.key,
          url: source.url,
          size,
          type: source.type,
          altText: source.altText || null,
          mimeType: source.mimeType || null,
        },
        select: mediaLibrarySelect,
      });

      // The legacy provider path records the object exactly as it arrived:
      // there is no recorded driver in that era, which resolves as UploadThing.
      await createStoredFileForMedia(tx, media.id, {
        key,
        driver: recordedStorageDriverName(null),
        remoteUrl: remoteUrlForAddress(source.url),
        contentType: source.mimeType || null,
        size,
        checksum: null,
      });

      return media;
    },
  );
}

interface StoredImageRevision {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  metadata: PrismaJson.MediaMetadata;
  renditions: MediaRendition[];
}

interface StoredPlainRevision {
  key: string;
  url: string;
  size: number;
  mimeType: string | null;
}

export interface WriteImageRevisionOptions {
  driver: StorageDriver;
  id: string;
  revision: number;
  installationSlug?: string;
  bytes: Uint8Array<ArrayBuffer>;
  archived: boolean;
  /**
   * Roll back the objects written under this revision on failure. A backfill
   * that reuses an existing original must not: deleting the prefix would
   * remove the object the Media is currently delivered from.
   */
  cleanupOnFailure?: boolean;
}

export async function writeImageRevision({
  driver,
  id,
  revision,
  installationSlug = getInstallationSlug(),
  bytes,
  archived,
  cleanupOnFailure = true,
}: WriteImageRevisionOptions): Promise<StoredImageRevision> {
  const prefix = mediaRevisionPrefix(id, revision, installationSlug);

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

    // Stored addresses are canonical and relative: the delivery route resolves
    // the driver from the row. Rendition URLs are resolved through the driver,
    // so a remote Media carries the provider origin inside its manifest.
    const renditionUrls = await Promise.all(
      manifest.map((rendition) => driver.url(rendition.key)),
    );
    const url = buildMediaDeliveryUrl(mediaPath(originalKey), {
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
    if (cleanupOnFailure) {
      await driver.deletePrefix(prefix).catch(() => undefined);
    }
    throw error;
  }
}

async function writePlainRevision({
  driver,
  id,
  revision,
  installationSlug,
  bytes,
  mimeType,
}: {
  driver: StorageDriver;
  id: string;
  revision: number;
  installationSlug: string;
  bytes: Uint8Array<ArrayBuffer>;
  mimeType: string | null;
}): Promise<StoredPlainRevision> {
  const prefix = mediaRevisionPrefix(id, revision, installationSlug);
  const key = `${prefix}original`;

  try {
    await driver.put(key, bytes, mimeType ?? "application/octet-stream");

    return {
      key,
      url: mediaPath(key),
      size: bytes.byteLength,
      mimeType,
    };
  } catch (error) {
    await driver.deletePrefix(prefix).catch(() => undefined);
    throw error;
  }
}

/**
 * Stores a non-image uploaded through the application transport under its own
 * revision and records the driver that wrote it. The temporary object is only
 * the processing input, so it is removed once the Media exists.
 */
async function createStoredPlainMedia({
  driver,
  storageDriver,
  source,
  override,
}: {
  driver: StorageDriver;
  storageDriver: StorageDriverName;
  source: MediaUploadSource;
  override: boolean;
}): Promise<MediaLibraryItem> {
  if (!source.key) {
    throw new MediaProcessingError(
      "The uploaded file cannot be processed because its storage key is missing.",
    );
  }

  const sourceKey = source.key;
  const id = randomUUID();
  const revision = 1;
  const installationSlug = getInstallationSlug();
  const prefix = mediaStoragePrefix(id, installationSlug);

  // The temporary object is the application transport's input, never a Media
  // object, so every outcome other than a created row removes it.
  const removeUploadedObject = async () => {
    if (sourceKey.startsWith(prefix)) return;
    await driver.delete(sourceKey).catch(() => undefined);
  };

  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = await driver.get(sourceKey);
  } catch (error) {
    await removeUploadedObject();
    throw new MediaProcessingError(
      "The uploaded file could not be read from storage.",
      { cause: error },
    );
  }

  const checksum = checksumOf(bytes);

  if (!override) {
    const existing = await findDuplicate(checksum);
    if (existing) {
      await removeUploadedObject();
      throw new DuplicateMediaError(existing);
    }
  }

  try {
    const stored = await writePlainRevision({
      driver,
      id,
      revision,
      installationSlug,
      bytes,
      mimeType: source.mimeType ?? null,
    });

    const remoteUrl = await remoteUrlForUpload(
      driver,
      storageDriver,
      stored.key,
    );

    const media = await withMediaQuotaAdmission(
      { incomingBytes: stored.size },
      async (tx) => {
        const created = await tx.media.create({
          data: {
            id,
            name: source.name,
            altText: source.altText || null,
            key: stored.key,
            url: stored.url,
            size: stored.size,
            type: source.type,
            mimeType: stored.mimeType,
            checksum,
            revision,
            storageDriver,
          },
          select: mediaLibrarySelect,
        });

        await createStoredFileForMedia(tx, created.id, {
          key: stored.key,
          driver: storageDriver,
          remoteUrl,
          contentType: stored.mimeType,
          size: stored.size,
          checksum,
        });

        return created;
      },
    );

    await removeUploadedObject();

    return media;
  } catch (error) {
    await driver.deletePrefix(prefix).catch(() => undefined);
    await removeUploadedObject();

    if (isRethrowableMediaError(error)) throw error;

    throw new MediaProcessingError(
      "The file could not be stored. Nothing was added to the library.",
      { cause: error },
    );
  }
}

export function storedImageFields(
  stored: StoredImageRevision,
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
 * library never holds a half-processed file. A non-image that arrives through
 * the application transport is stored as one original under the same layout;
 * one that arrives from the legacy provider path is recorded as before.
 */
export async function createMediaFromUpload({
  driver,
  storageDriver,
  source,
  override = false,
  storeUploadedObject = false,
}: CreateMediaFromUploadOptions): Promise<MediaLibraryItem> {
  if (source.type !== MediaType.IMAGE) {
    // Non-image uploads that did not arrive through the application transport
    // keep the legacy provider shape: the uploaded object is recorded exactly
    // as before and the row carries no driver, so it resolves as remote.
    if (!storeUploadedObject) {
      return createPlainMedia(source);
    }

    return createStoredPlainMedia({
      driver,
      storageDriver: await recordedStorageDriver(storageDriver),
      source,
      override,
    });
  }

  if (!source.key) {
    throw new MediaProcessingError(
      "The uploaded image cannot be processed because its storage key is missing.",
    );
  }

  const driverThatWrote = await recordedStorageDriver(storageDriver);

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
  const installationSlug = getInstallationSlug();
  const prefix = mediaStoragePrefix(id, installationSlug);

  try {
    const stored = await writeImageRevision({
      driver,
      id,
      revision,
      installationSlug,
      bytes: originalBytes,
      archived: false,
    });

    const remoteUrl = await remoteUrlForUpload(
      driver,
      driverThatWrote,
      stored.key,
    );

    const media = await withMediaQuotaAdmission(
      {
        incomingBytes: mediaUsageBytes([
          { size: stored.size, renditions: stored.renditions },
        ]),
      },
      async (tx) => {
        const created = await tx.media.create({
          data: {
            ...storedImageFields(stored, revision, checksum),
            id,
            name: source.name,
            altText: source.altText || null,
            storageDriver: driverThatWrote,
          },
          select: mediaLibrarySelect,
        });

        await createStoredFileForMedia(tx, created.id, {
          key: stored.key,
          driver: driverThatWrote,
          remoteUrl,
          contentType: stored.mimeType,
          size: stored.size,
          checksum,
        });

        return created;
      },
    );

    // The uploaded object was only the processing input. Best-effort removal
    // keeps the storage tier clean; legacy UploadThing file keys are not
    // addressable by customId and simply stay behind.
    if (!source.key.startsWith(prefix)) {
      await driver.delete(source.key).catch(() => undefined);
    }

    return media;
  } catch (error) {
    await driver.deletePrefix(prefix).catch(() => undefined);

    if (isRethrowableMediaError(error)) throw error;

    throw new MediaProcessingError(
      "The image could not be processed. Nothing was added to the library.",
      { cause: error },
    );
  }
}

/**
 * Removes the bytes of the revision the row no longer points at, through the
 * driver recorded on that row rather than the active one. A provider that is
 * not configured on this instance is skipped instead of failing the replace;
 * every other hiccup is logged and reported, and never turns a successful
 * replacement into a failure.
 */
async function cleanupPreviousRevision({
  media,
  installationSlug,
  active,
  env,
}: {
  media: {
    id: string;
    key: string | null;
    revision: number;
    storageDriver: string | null;
  };
  installationSlug: string;
  active: ResolvedStorageDriver;
  env: StorageEnvironment;
}): Promise<MediaCleanupStatus> {
  // A Media with no recorded driver was written before the storage seam: it
  // lives on UploadThing and its object is addressed by the provider's file
  // key, not by a revision prefix.
  const resolution = resolveMediaStorageDriver(media.storageDriver, {
    active,
    env,
  });

  if (!resolution.resolved) return "skipped";

  const recorded = parseStorageDriver(media.storageDriver);
  const previousDriver = resolution.driver;

  const prefix =
    recorded === null
      ? null
      : media.key
        ? mediaKeyDirectory(media.key)
        : mediaRevisionPrefix(media.id, media.revision, installationSlug);
  let failed = false;

  if (prefix) {
    try {
      await previousDriver.deletePrefix(prefix);
    } catch (error) {
      failed = true;
      console.error(
        "[MEDIA_REPLACE] Could not remove the previous revision",
        error,
      );
    }
  }

  // A legacy row records one provider object, and a flat key has no directory
  // at all: remove that exact object instead of a prefix.
  const exactKey = prefix === null ? media.key : null;
  if (exactKey) {
    try {
      await previousDriver.delete(exactKey);
    } catch (error) {
      if (!(error instanceof StorageObjectNotFoundError)) {
        failed = true;
        console.error(
          "[MEDIA_REPLACE] Could not remove the previous original",
          error,
        );
      }
    }
  }

  return failed ? "failed" : "removed";
}

/**
 * Replaces the bytes of an existing Media without changing its identity.
 *
 * The new revision is written through the active driver under
 * `<mediaId>/<revision>/` first, the row is updated, and only then the previous
 * revision is removed through the driver recorded on the row. A failure before
 * the row update deletes only the new prefix, so the old bytes, address and
 * manifest remain delivered exactly as before.
 *
 * The uploaded object is only this transport's input: it is removed on every
 * outcome, including an unknown Media.
 */
export async function replaceMediaFile({
  driver,
  storageDriver,
  mediaId,
  source,
  env = process.env,
}: ReplaceMediaFileOptions): Promise<ReplaceMediaFileResult> {
  const sourceKey = source.key;

  if (!sourceKey) {
    throw new MediaProcessingError(
      "The replacement file cannot be processed because its storage key is missing.",
    );
  }

  const installationSlug = getInstallationSlug(env);
  const mediaPrefix = mediaStoragePrefix(mediaId, installationSlug);

  try {
    const existing = await db.media.findUnique({ where: { id: mediaId } });

    if (!existing) throw new MediaNotFoundError(mediaId);

    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = await driver.get(sourceKey);
    } catch (error) {
      throw new MediaProcessingError(
        "The replacement file could not be read from storage.",
        { cause: error },
      );
    }

    const revision = existing.revision + 1;
    const newPrefix = mediaRevisionPrefix(mediaId, revision, installationSlug);
    const checksum = checksumOf(bytes);

    let media: MediaLibraryItem;

    try {
      if (existing.type === MediaType.IMAGE) {
        const stored = await writeImageRevision({
          driver,
          id: mediaId,
          revision,
          installationSlug,
          bytes,
          archived: existing.archivedAt !== null,
        });

        const location = {
          key: stored.key,
          driver: storageDriver,
          remoteUrl: await remoteUrlForUpload(driver, storageDriver, stored.key),
          contentType: stored.mimeType,
          size: stored.size,
          checksum,
        };

        media = await withMediaQuotaAdmission(
          {
            incomingBytes: mediaUsageBytes([
              { size: stored.size, renditions: stored.renditions },
            ]),
            excludeMediaId: mediaId,
          },
          async (tx) => {
            const updated = await tx.media.update({
              where: { id: mediaId },
              data: {
                ...storedImageFields(stored, revision, checksum),
                storageDriver,
              },
              select: mediaLibrarySelect,
            });
            const file = mediaStoredFileCreateData(mediaId, location);

            await tx.storedFile.upsert({
              where: { mediaId },
              create: file,
              update: file,
            });

            return updated;
          },
        );
      } else {
        const stored = await writePlainRevision({
          driver,
          id: mediaId,
          revision,
          installationSlug,
          bytes,
          mimeType: source.mimeType || existing.mimeType,
        });

        const location = {
          key: stored.key,
          driver: storageDriver,
          remoteUrl: await remoteUrlForUpload(driver, storageDriver, stored.key),
          contentType: stored.mimeType,
          size: stored.size,
          checksum,
        };

        media = await withMediaQuotaAdmission(
          { incomingBytes: stored.size, excludeMediaId: mediaId },
          async (tx) => {
            const updated = await tx.media.update({
              where: { id: mediaId },
              data: {
                key: stored.key,
                url: stored.url,
                size: stored.size,
                mimeType: stored.mimeType,
                checksum,
                revision,
                storageDriver,
                metadata: null,
                renditions: null,
              },
              select: mediaLibrarySelect,
            });
            const file = mediaStoredFileCreateData(mediaId, location);

            await tx.storedFile.upsert({
              where: { mediaId },
              create: file,
              update: file,
            });

            return updated;
          },
        );
      }
    } catch (error) {
      await driver.deletePrefix(newPrefix).catch(() => undefined);

      if (isRethrowableMediaError(error)) throw error;

      throw new MediaProcessingError(
        "The file could not be replaced. The previous version is still in place.",
        { cause: error },
      );
    }

    // The row already points at the new revision, so a cleanup hiccup must not
    // turn a successful replacement into a reported failure.
    const previousRevisionCleanup = await cleanupPreviousRevision({
      media: existing,
      installationSlug,
      active: { driver, name: storageDriver },
      env,
    });

    return { media, previousRevisionCleanup };
  } finally {
    // The uploaded object is the transport's input, never a Media object. The
    // Media's own prefix is spared so the revision being served is untouched.
    if (!sourceKey.startsWith(mediaPrefix)) {
      await driver.delete(sourceKey).catch(() => undefined);
    }
  }
}

/**
 * Loads every requested Media before a batch transition, so an unknown id
 * aborts the whole call instead of leaving a partially applied selection.
 */
async function loadMediaForBatch(mediaIds: string[]) {
  const uniqueIds = [...new Set(mediaIds)];
  if (uniqueIds.length === 0) return [];

  const media = await db.media.findMany({
    where: { id: { in: uniqueIds } },
  });

  const found = new Set(media.map((item) => item.id));
  const missing = uniqueIds.find((id) => !found.has(id));
  if (missing) throw new MediaNotFoundError(missing);

  return media;
}

/**
 * Hides a list of Media from the library without touching their bytes or
 * references. Archived media keep being served (the loader falls back to the
 * original), which is why archiving is reversible and never clears a cover.
 * Already-archived rows are left untouched, so the number returned is how many
 * actually transitioned.
 */
export async function archiveMediaBatch(mediaIds: string[]): Promise<number> {
  const pending = (await loadMediaForBatch(mediaIds)).filter(
    (item) => item.archivedAt === null,
  );
  if (pending.length === 0) return 0;

  const archivedAt = new Date();

  await db.$transaction(
    pending.map((item) =>
      db.media.update({
        where: { id: item.id },
        data: {
          archivedAt,
          url: withMediaDeliveryArchived(item.url, true),
        },
      }),
    ),
  );

  return pending.length;
}

/**
 * Brings a list of archived Media back into the library and re-enables their
 * renditions, returning how many actually transitioned.
 */
export async function restoreMediaBatch(mediaIds: string[]): Promise<number> {
  const pending = (await loadMediaForBatch(mediaIds)).filter(
    (item) => item.archivedAt !== null,
  );
  if (pending.length === 0) return 0;

  await db.$transaction(
    pending.map((item) =>
      db.media.update({
        where: { id: item.id },
        data: {
          archivedAt: null,
          url: withMediaDeliveryArchived(item.url, false),
        },
      }),
    ),
  );

  return pending.length;
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
  /** The active driver, reused for rows recorded against it. */
  active: ResolvedStorageDriver;
  mediaId: string;
  /** Resolves each row's recorded driver; defaults to the process env. */
  env?: StorageEnvironment;
}

export interface DeleteMediaPermanentlyBatchOptions
  extends Omit<DeleteMediaPermanentlyOptions, "mediaId"> {
  mediaIds: string[];
}

export interface DeleteMediaPermanentlyBatchResult {
  deleted: number;
  /**
   * What happened to each deleted Media's objects, in the order the rows were
   * processed. A row whose provider cannot be reached here is `skipped`, never
   * a reason to abort the batch.
   */
  cleanup: MediaDeletionCleanup[];
}

type MediaObjectCleanup = Pick<MediaDeletionCleanup, "status" | "reason">;

/**
 * Removes one Media's objects through the driver that wrote them.
 *
 * A namespaced Media is removed by its whole prefix, so no stale revision is
 * left behind. A row with no recorded driver predates the namespace: its key is
 * the provider's own file key, which a customId prefix scan cannot address, so
 * that exact object is the unit of cleanup.
 */
async function removeMediaObjects({
  media,
  active,
  installationSlug,
  env,
  drivers,
}: {
  media: { id: string; key: string | null; storageDriver: string | null };
  active: ResolvedStorageDriver;
  installationSlug: string;
  env: StorageEnvironment;
  drivers: Map<StorageDriverName, StorageDriver>;
}): Promise<MediaObjectCleanup> {
  const resolution = resolveMediaStorageDriver(media.storageDriver, {
    active,
    env,
    cache: drivers,
  });

  if (!resolution.resolved) {
    return { status: "skipped", reason: resolution.reason };
  }

  if (parseStorageDriver(media.storageDriver) === null) {
    if (!media.key) return { status: "removed" };

    try {
      await resolution.driver.delete(media.key);
    } catch (error) {
      if (error instanceof StorageObjectNotFoundError) {
        return { status: "removed" };
      }

      console.error(
        "[MEDIA_DELETE] Could not remove the legacy original",
        error,
      );
      return { status: "failed" };
    }

    return { status: "removed" };
  }

  await resolution.driver.deletePrefix(
    mediaStoragePrefixForKey(media.id, media.key, installationSlug),
  );

  return { status: "removed" };
}

/**
 * Permanently removes archived Media.
 *
 * Every id is validated before anything is touched: an active Media or one
 * still referenced by content aborts the whole batch, so a selected cover is
 * never cleared silently. Each row's objects are then removed through the
 * driver recorded on it and the row is deleted before the next one starts, so
 * a storage failure never leaves a row whose bytes are already gone.
 */
export async function deleteMediaPermanentlyBatch({
  active,
  mediaIds,
  env = process.env,
}: DeleteMediaPermanentlyBatchOptions): Promise<DeleteMediaPermanentlyBatchResult> {
  const uniqueIds = [...new Set(mediaIds)];
  if (uniqueIds.length === 0) return { deleted: 0, cleanup: [] };

  const media = await db.media.findMany({
    where: { id: { in: uniqueIds } },
    // A deterministic order lets the batch delete as it goes: the rows that
    // were already cleaned are gone, and the rest are untouched.
    orderBy: { createdAt: "asc" },
  });

  const found = new Set(media.map((item) => item.id));
  const missing = uniqueIds.find((id) => !found.has(id));
  if (missing) throw new MediaNotFoundError(missing);

  const notArchived = media.find((item) => item.archivedAt === null);
  if (notArchived) throw new MediaNotArchivedError(notArchived.id);

  const usage = await countMediaReferencesFor(uniqueIds);
  const referenced = uniqueIds.find((id) => (usage.get(id) ?? 0) > 0);
  if (referenced) {
    throw new MediaInUseError(referenced, usage.get(referenced) ?? 0);
  }

  const installationSlug = getInstallationSlug(env);
  const drivers = new Map<StorageDriverName, StorageDriver>([
    [active.name, active.driver],
  ]);
  const cleanup: MediaDeletionCleanup[] = [];
  let deleted = 0;

  for (const item of media) {
    let outcome: MediaObjectCleanup;

    try {
      outcome = await removeMediaObjects({
        media: item,
        active,
        installationSlug,
        env,
        drivers,
      });
    } catch (error) {
      throw new MediaProcessingError(
        deleted === 0
          ? "The stored objects could not be removed. Nothing was deleted."
          : `${deleted} ${
              deleted === 1 ? "Media was" : "Media were"
            } deleted; the rest were left untouched because their stored objects could not be removed.`,
        { cause: error },
      );
    }

    cleanup.push({ mediaId: item.id, ...outcome });
    await db.media.delete({ where: { id: item.id } });
    deleted += 1;
  }

  return { deleted, cleanup };
}

export async function deleteMediaPermanently(
  options: DeleteMediaPermanentlyOptions,
): Promise<MediaDeletionCleanup> {
  const result = await deleteMediaPermanentlyBatch({
    ...options,
    mediaIds: [options.mediaId],
  });

  return result.cleanup[0];
}
