import "server-only";

import { db } from "@/shared/lib/db";

import { mediaSourceKey } from "@/modules/media/lib/url";

import { describeBackfillFailure } from "./backfill-failure";
import { recordedStorageDriverName } from "./storage";
import {
  mediaStoredFileCreateData,
  remoteUrlForAddress,
} from "./stored-file";

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

/**
 * Creates the one StoredFile record every Media needs, from what the library
 * already knows: its key, driver, size, content type, checksum and the remote
 * address its absolute or legacy-provider address names.
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

    const found = byKey.get(key);
    if (found?.mediaId && found.mediaId !== item.id) {
      const reason = "storage key already belongs to another file";
      report.failed.push({ mediaId: item.id, name: item.name, reason });
      onProgress?.(`fail ${item.id}: ${reason}`);
      continue;
    }

    try {
      const data = mediaStoredFileCreateData(item.id, {
        key,
        driver: recordedStorageDriverName(item.storageDriver),
        remoteUrl: remoteUrlForAddress(item.url),
        contentType: item.mimeType,
        size: item.size,
        checksum: item.checksum,
      });

      if (!dryRun) {
        const file = found
          ? await db.storedFile.update({
              where: { id: found.id },
              data,
            })
          : await db.storedFile.create({ data });

        byKey.set(file.key, file);
        byMediaId.set(item.id, file);
      }

      report.created += 1;
      onProgress?.(`${dryRun ? "would create" : "create"} ${item.id}`);
    } catch (error) {
      const reason = describeBackfillFailure(error);
      report.failed.push({ mediaId: item.id, name: item.name, reason });
      onProgress?.(`fail ${item.id}: ${reason}`);
    }
  }

  return report;
}
