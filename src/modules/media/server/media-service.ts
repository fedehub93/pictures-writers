import "server-only";

import { randomUUID } from "node:crypto";

import { MediaType, StoredFileKind, type Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import {
  mediaLibraryItem,
  mediaLibraryRowSelect,
  type MediaLibraryItem,
} from "@/modules/media/lib/media-library";
import { mediaUsageBytes } from "@/modules/media/lib/quota";
import type {
  MediaCleanupStatus,
  MediaDeletionCleanup,
  MediaRendition,
} from "@/modules/media/types";

import {
  mediaStoredLocation,
  storedFileLocationSelect,
  type StoredFileLocationRow,
} from "@/modules/media/lib/stored-file-location";

import { checksumOf } from "./image-bytes";
import {
  mediaKeyDirectory,
  mediaRevisionPrefix,
  mediaStoragePrefix,
  mediaStoragePrefixForKey,
  parseMediaKey,
} from "./media-key";
import {
  MediaQuotaExceededError,
  withMediaQuotaAdmission,
} from "./media-quota";
import { countMediaReferencesFor } from "./media-usage";
import { generateRenditions, normaliseImage } from "./process-image";
import {
  getInstallationSlug,
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
  remoteUrlForUpload,
} from "./stored-file";

/**
 * One file uploaded through the application transport: the temporary object
 * the active driver wrote, and what the admin typed beside it.
 */
export interface MediaUploadSource {
  key: string;
  name: string;
  type: MediaType;
  altText?: string | null;
  mimeType?: string | null;
}

export interface CreateMediaFromUploadOptions {
  driver: StorageDriver;
  /** The driver that wrote this file. Defaults to the active driver. */
  storageDriver?: StorageDriverName;
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

/**
 * Re-reads a row with its stored-file record once a write has created it, so
 * the answer carries the storage facts whether or not the record already
 * existed before the write.
 */
async function readLibraryItem(
  client: Pick<Prisma.TransactionClient, "media">,
  id: string,
): Promise<MediaLibraryItem> {
  const row = await client.media.findUniqueOrThrow({
    where: { id },
    select: mediaLibraryRowSelect,
  });

  return mediaLibraryItem(row);
}

async function findDuplicate(
  checksum: string,
): Promise<MediaLibraryItem | null> {
  const file = await db.storedFile.findFirst({
    where: {
      checksum,
      kind: StoredFileKind.MEDIA,
      media: { is: { archivedAt: null } },
    },
    select: { media: { select: mediaLibraryRowSelect } },
    orderBy: { createdAt: "asc" },
  });

  return file?.media ? mediaLibraryItem(file.media) : null;
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

interface StoredImageRevision {
  key: string;
  size: number;
  mimeType: string;
  metadata: PrismaJson.MediaMetadata;
  renditions: MediaRendition[];
}

interface StoredPlainRevision {
  key: string;
  size: number;
  mimeType: string | null;
}

export interface WriteImageRevisionOptions {
  driver: StorageDriver;
  id: string;
  revision: number;
  installationSlug?: string;
  bytes: Uint8Array<ArrayBuffer>;
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

    // The address a rendition answers on is resolved once, when its bytes are
    // written: canonical for a local file, the provider's for a remote one.
    // Delivery redirects a remote rendition through the manifest entry, so it
    // never asks the provider to resolve a key.
    const renditionUrls = await Promise.all(
      manifest.map((rendition) => driver.url(rendition.key)),
    );
    const renditions = manifest.map((rendition, index) => ({
      ...rendition,
      url: renditionUrls[index]!,
    }));

    return {
      key: originalKey,
      size: image.bytes.byteLength,
      mimeType: image.mimeType,
      metadata: image.metadata as PrismaJson.MediaMetadata,
      renditions,
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
            type: source.type,
            revision,
          },
          select: { id: true },
        });

        await createStoredFileForMedia(tx, created.id, {
          key: stored.key,
          driver: storageDriver,
          remoteUrl,
          contentType: stored.mimeType,
          size: stored.size,
          checksum,
        });

        return readLibraryItem(tx, created.id);
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
) {
  return {
    type: MediaType.IMAGE,
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
 * library never holds a half-processed file. A non-image is copied untouched
 * under the same layout.
 */
export async function createMediaFromUpload({
  driver,
  storageDriver,
  source,
  override = false,
}: CreateMediaFromUploadOptions): Promise<MediaLibraryItem> {
  if (source.type !== MediaType.IMAGE) {
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
            ...storedImageFields(stored, revision),
            id,
            name: source.name,
            altText: source.altText || null,
          },
          select: { id: true },
        });

        await createStoredFileForMedia(tx, created.id, {
          key: stored.key,
          driver: driverThatWrote,
          remoteUrl,
          contentType: stored.mimeType,
          size: stored.size,
          checksum,
        });

        return readLibraryItem(tx, created.id);
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

interface MediaCleanupRow {
  id: string;
  revision: number;
  renditions: unknown;
  storedFile: StoredFileLocationRow | null;
}

/**
 * The unit of removal for one Media's objects: the driver that owns them, the
 * directory holding a revision when it has one, and every recorded key that
 * may sit outside that directory.
 */
interface MediaCleanupTarget {
  driver: string | null;
  prefix: string | null;
  keys: string[];
}

/**
 * The pre-seam layout was `<mediaId>/<revision>/<file>` and carried no
 * installation slug, so a legacy key's own segments are the prefix. A flat
 * provider key has no directory at all.
 */
function legacyKeyPrefix(
  key: string,
  scope: "revision" | "installation",
): string | null {
  const segments = key.split("/");
  if (segments.length < 2) return null;

  const depth = scope === "installation" ? 1 : Math.min(2, segments.length - 1);
  return `${segments.slice(0, depth).join("/")}/`;
}

/**
 * Where one Media's objects are, read from its stored-file record.
 *
 * A namespaced key is one directory: the superseded revision's directory for a
 * replace, the Media's whole installation directory for a deletion. A legacy
 * key may be a provider file key that a customId scan cannot find, while its
 * renditions are separate objects: the exact key and every key recorded in the
 * manifest are named directly, and the legacy directory is removed as well so
 * an interrupted operation cannot leave an object behind. The stored-file
 * record is the only answer for the key and the driver.
 */
function mediaCleanupTarget(
  media: MediaCleanupRow,
  installationSlug: string,
  scope: "revision" | "installation",
): MediaCleanupTarget {
  const location = mediaStoredLocation(media.storedFile);
  const key = location?.key ?? null;
  const renditions = Array.isArray(media.renditions)
    ? (media.renditions as MediaRendition[])
    : [];
  const renditionKeys = renditions
    .map((rendition) => rendition.key)
    .filter((candidate): candidate is string => typeof candidate === "string");

  if (key && parseMediaKey(key)) {
    const prefix =
      scope === "installation"
        ? mediaStoragePrefixForKey(media.id, key, installationSlug)
        : mediaKeyDirectory(key);

    return { driver: location?.driver ?? null, prefix, keys: [] };
  }

  if (key) {
    return {
      driver: location?.driver ?? null,
      prefix: legacyKeyPrefix(key, scope),
      keys: [...new Set([key, ...renditionKeys])],
    };
  }

  return {
    driver: location?.driver ?? null,
    prefix:
      scope === "installation"
        ? mediaStoragePrefixForKey(media.id, null, installationSlug)
        : null,
    keys: renditionKeys,
  };
}

/**
 * Removes the bytes of the revision the row no longer points at, through the
 * driver recorded on its stored-file record rather than the active one. A
 * driver that is not configured on this instance is skipped instead of failing
 * the replace; every other hiccup is logged and reported, and never turns a
 * successful replacement into a failure.
 */
async function cleanupPreviousRevision({
  media,
  installationSlug,
  active,
  env,
}: {
  media: MediaCleanupRow;
  installationSlug: string;
  active: ResolvedStorageDriver;
  env: StorageEnvironment;
}): Promise<MediaCleanupStatus> {
  const target = mediaCleanupTarget(media, installationSlug, "revision");
  const resolution = resolveMediaStorageDriver(target.driver, {
    active,
    env,
  });

  if (!resolution.resolved) return "skipped";

  const previousDriver = resolution.driver;
  let failed = false;

  if (target.prefix) {
    try {
      await previousDriver.deletePrefix(target.prefix);
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
  for (const key of target.keys) {
    try {
      await previousDriver.delete(key);
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
    const existing = await db.media.findUnique({
      where: { id: mediaId },
      include: { storedFile: { select: storedFileLocationSelect } },
    });

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
                ...storedImageFields(stored, revision),
              },
              select: { id: true },
            });
            const file = mediaStoredFileCreateData(mediaId, location);

            await tx.storedFile.upsert({
              where: { mediaId },
              create: file,
              update: file,
            });

            return readLibraryItem(tx, updated.id);
          },
        );
      } else {
        const stored = await writePlainRevision({
          driver,
          id: mediaId,
          revision,
          installationSlug,
          bytes,
          mimeType:
            source.mimeType || existing.storedFile?.contentType || null,
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
                revision,
                metadata: null,
                renditions: null,
              },
              select: { id: true },
            });
            const file = mediaStoredFileCreateData(mediaId, location);

            await tx.storedFile.upsert({
              where: { mediaId },
              create: file,
              update: file,
            });

            return readLibraryItem(tx, updated.id);
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
    include: { storedFile: { select: storedFileLocationSelect } },
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
        data: { archivedAt },
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
        data: { archivedAt: null },
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
    return readLibraryItem(db, mediaId);
  }

  await db.media.update({
    where: { id: mediaId },
    data: { archivedAt: new Date() },
    select: { id: true },
  });

  return readLibraryItem(db, mediaId);
}

/**
 * Brings an archived Media back into the library and re-enables its
 * renditions.
 */
export async function restoreMedia(mediaId: string): Promise<MediaLibraryItem> {
  const existing = await db.media.findUnique({ where: { id: mediaId } });

  if (!existing) throw new MediaNotFoundError(mediaId);
  if (!existing.archivedAt) {
    return readLibraryItem(db, mediaId);
  }

  await db.media.update({
    where: { id: mediaId },
    data: { archivedAt: null },
    select: { id: true },
  });

  return readLibraryItem(db, mediaId);
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
  media: MediaCleanupRow;
  active: ResolvedStorageDriver;
  installationSlug: string;
  env: StorageEnvironment;
  drivers: Map<StorageDriverName, StorageDriver>;
}): Promise<MediaObjectCleanup> {
  const target = mediaCleanupTarget(media, installationSlug, "installation");
  const resolution = resolveMediaStorageDriver(target.driver, {
    active,
    env,
    cache: drivers,
  });

  if (!resolution.resolved) {
    return { status: "skipped", reason: resolution.reason };
  }

  if (target.prefix) {
    await resolution.driver.deletePrefix(target.prefix);
  }

  for (const key of target.keys) {
    try {
      await resolution.driver.delete(key);
    } catch (error) {
      if (error instanceof StorageObjectNotFoundError) continue;

      console.error("[MEDIA_DELETE] Could not remove the legacy original", error);
      return { status: "failed" };
    }
  }

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
    include: { storedFile: { select: storedFileLocationSelect } },
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
