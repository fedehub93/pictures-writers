import "server-only";

import { db } from "@/shared/lib/db";

import { stripMediaManifest } from "@/modules/media/lib/manifest";
import { mediaSourceKey, parseSrc } from "@/modules/media/lib/url";

export interface StoredFileBackfillFailure {
  mediaId: string;
  name: string;
  reason: string;
}

export interface StoredFileBackfillReport {
  /** Media examined in this run. */
  scanned: number;
  /** Records created, or that would be created in a dry run. */
  created: number;
  /** Media that already had a record and were left untouched. */
  skipped: number;
  /** Media that could not be recorded, each with its reason. */
  failed: StoredFileBackfillFailure[];
  dryRun: boolean;
}

export interface StoredFileBackfillOptions {
  /** Limit the run to specific Media ids. Used by tests and by retries. */
  mediaIds?: string[];
  dryRun?: boolean;
  onProgress?: (line: string) => void;
}

type BackfillMedia = {
  id: string;
  name: string;
  key: string | null;
  url: string;
  storageDriver: string | null;
  mimeType: string | null;
  size: number | null;
  checksum: string | null;
};

/**
 * The driver an existing Media's bytes live on. A row with no recorded driver
 * predates the storage seam, so it resolves as UploadThing exactly as delivery
 * does today. A name this build does not know is preserved rather than guessed
 * at, so the audit can report it.
 */
function recordedDriver(media: Pick<BackfillMedia, "storageDriver">): string {
  const recorded = media.storageDriver?.trim();
  return recorded ? recorded : "uploadthing";
}

/**
 * The provider address already stored on a Media whose address is absolute.
 * A local Media carries a canonical relative address, so it has no remote
 * location. The rendition token is not part of the object's address.
 */
function recordedRemoteUrl(media: Pick<BackfillMedia, "url">): string | null {
  return parseSrc(media.url).absolute
    ? stripMediaManifest(media.url)
    : null;
}

/**
 * Creates the one StoredFile record every Media needs, from what the library
 * already knows: its key, driver, size, content type, checksum and the
 * absolute address when it has one.
 *
 * The command never rewrites a Media row. It is idempotent: a Media that
 * already has a record is skipped, and a record found by key is linked instead
 * of duplicated. A Media whose key cannot be read is reported and skipped, so
 * a one-time run can be inspected rather than trusted.
 */
export async function backfillStoredFiles({
  mediaIds,
  dryRun = false,
  onProgress,
}: StoredFileBackfillOptions = {}): Promise<StoredFileBackfillReport> {
  const report: StoredFileBackfillReport = {
    scanned: 0,
    created: 0,
    skipped: 0,
    failed: [],
    dryRun,
  };

  const media = await db.media.findMany({
    where: mediaIds ? { id: { in: mediaIds } } : undefined,
    select: {
      id: true,
      name: true,
      key: true,
      url: true,
      storageDriver: true,
      mimeType: true,
      size: true,
      checksum: true,
    },
    orderBy: { createdAt: "asc" },
  });

  report.scanned = media.length;

  const keys = media
    .map((item) => mediaSourceKey(item))
    .filter((key): key is string => key !== null);

  const existing = await db.storedFile.findMany({
    where:
      keys.length > 0
        ? {
            OR: [
              { mediaId: { in: media.map((item) => item.id) } },
              { key: { in: keys } },
            ],
          }
        : { mediaId: { in: media.map((item) => item.id) } },
    select: { id: true, key: true, mediaId: true },
  });

  const byMediaId = new Map(
    existing
      .filter((file) => file.mediaId !== null)
      .map((file) => [file.mediaId as string, file]),
  );
  const byKey = new Map(existing.map((file) => [file.key, file]));

  for (const item of media) {
    if (byMediaId.has(item.id)) {
      report.skipped += 1;
      onProgress?.(`skip ${item.id}: already recorded`);
      continue;
    }

    const key = mediaSourceKey(item);
    if (!key) {
      const reason = "no readable storage key";
      report.failed.push({ mediaId: item.id, name: item.name, reason });
      onProgress?.(`fail ${item.id}: ${reason}`);
      continue;
    }

    const location = {
      key,
      driver: recordedDriver(item),
      remoteUrl: recordedRemoteUrl(item),
      contentType: item.mimeType,
      size: item.size,
      checksum: item.checksum,
      kind: "MEDIA" as const,
      origin: "INTERNAL" as const,
    };

    const found = byKey.get(key);
    if (found?.mediaId && found.mediaId !== item.id) {
      const reason = "storage key already belongs to another file";
      report.failed.push({ mediaId: item.id, name: item.name, reason });
      onProgress?.(`fail ${item.id}: ${reason}`);
      continue;
    }

    if (!dryRun) {
      if (found) {
        await db.storedFile.update({
          where: { id: found.id },
          data: { ...location, mediaId: item.id },
        });
      } else {
        await db.storedFile.create({
          data: { ...location, mediaId: item.id },
        });
      }
    }

    report.created += 1;
    onProgress?.(`${dryRun ? "would create" : "create"} ${item.id}`);
  }

  return report;
}
