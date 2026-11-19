import "server-only";

import type { Prisma } from "@/generated/prisma";
import { MediaType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { describeBackfillFailure } from "./backfill-failure";
import { forEachWithConcurrency } from "./bounded-concurrency";
import { inspectImage } from "./inspect-image";
import {
  resolveMediaStorageDriver,
  type ResolvedStorageDriver,
  type StorageDriver,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";
import {
  mediaStorageLocation,
  storedFileLocationSelect,
  updateStoredFileForMedia,
} from "./stored-file";

export interface MediaMetadataBackfillFailure {
  mediaId: string;
  name: string;
  reason: string;
}

export interface MediaMetadataBackfillReport {
  scanned: number;
  updated: number;
  skipped: number;
  failed: MediaMetadataBackfillFailure[];
  dryRun: boolean;
}

export interface MediaMetadataBackfillOptions {
  /** The active driver, reused for rows recorded against it. */
  active: ResolvedStorageDriver;
  /** Resolves each row's recorded driver; defaults to the process env. */
  env?: StorageEnvironment;
  /** Limit the run to specific Media ids. Used by tests and by retries. */
  mediaIds?: string[];
  concurrency?: number;
  dryRun?: boolean;
  onProgress?: (line: string) => void;
}

const metadataMediaSelect = {
  id: true,
  name: true,
  key: true,
  url: true,
  storageDriver: true,
  mimeType: true,
  size: true,
  checksum: true,
  metadata: true,
  storedFile: { select: storedFileLocationSelect },
} satisfies Prisma.MediaSelect;

type BackfillMedia = Prisma.MediaGetPayload<{
  select: typeof metadataMediaSelect;
}>;

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

/**
 * Whether the row already carries everything this backfill would write, on
 * both the Media and — when it exists — its stored-file record. Requiring both
 * keeps the record and the mirrored columns in step; a record left empty by a
 * previous state is filled, not trusted because the Media column happens to
 * be complete.
 */
function hasCompleteMetadata(media: BackfillMedia): boolean {
  const metadata = asObject(media.metadata);
  const mediaComplete =
    typeof media.mimeType === "string" &&
    media.mimeType.length > 0 &&
    typeof media.size === "number" &&
    media.size > 0 &&
    typeof media.checksum === "string" &&
    media.checksum.length > 0 &&
    typeof metadata.width === "number" &&
    typeof metadata.height === "number" &&
    typeof metadata.blurDataURL === "string" &&
    metadata.blurDataURL.startsWith("data:");

  if (!mediaComplete) return false;

  const record = media.storedFile;
  if (!record) return true;

  return (
    typeof record.contentType === "string" &&
    record.contentType.length > 0 &&
    typeof record.size === "number" &&
    record.size > 0 &&
    typeof record.checksum === "string" &&
    record.checksum.length > 0
  );
}

/**
 * Fills the metadata of every image Media that is missing it. It only writes
 * derived columns, so running it again is a no-op for already-processed rows.
 * Unreachable sources are reported and skipped, never fatal.
 *
 * Each row is read through the driver recorded on its stored-file record; the
 * Media's own storage columns answer only until that record exists. A library
 * that mixes legacy provider Media and Media written by the local driver is
 * processed in one run. A driver this instance cannot reach is reported with
 * the row and the run continues. The record learns the same content type, size
 * and checksum the run discovers, so it stays the one place that describes the
 * bytes.
 */
export async function backfillMediaMetadata({
  active,
  env = process.env,
  mediaIds,
  concurrency = 4,
  dryRun = false,
  onProgress,
}: MediaMetadataBackfillOptions): Promise<MediaMetadataBackfillReport> {
  const report: MediaMetadataBackfillReport = {
    scanned: 0,
    updated: 0,
    skipped: 0,
    failed: [],
    dryRun,
  };

  const media = await db.media.findMany({
    where: {
      type: MediaType.IMAGE,
      ...(mediaIds ? { id: { in: mediaIds } } : {}),
    },
    select: metadataMediaSelect,
    orderBy: { createdAt: "asc" },
  });

  report.scanned = media.length;

  // One client per driver for the whole run, shared by every row it wrote.
  const drivers = new Map<StorageDriverName, StorageDriver>([
    [active.name, active.driver],
  ]);

  await forEachWithConcurrency(media, concurrency, async (item) => {
    if (hasCompleteMetadata(item)) {
      report.skipped += 1;
      onProgress?.(`skip ${item.id}: already described`);
      return;
    }

    try {
      const location = mediaStorageLocation(item);
      const key = location.key;

      if (!key) {
        report.failed.push({
          mediaId: item.id,
          name: item.name,
          reason: "no readable storage key",
        });
        onProgress?.(`fail ${item.id}: no readable storage key`);
        return;
      }

      const resolution = resolveMediaStorageDriver(location.driver, {
        active,
        env,
        cache: drivers,
      });

      if (!resolution.resolved) {
        report.failed.push({
          mediaId: item.id,
          name: item.name,
          reason: resolution.reason,
        });
        onProgress?.(`fail ${item.id}: ${resolution.reason}`);
        return;
      }

      const bytes = await resolution.driver.get(key);
      const inspected = await inspectImage(bytes);

      if (!dryRun) {
        const data = {
          size: inspected.size,
          mimeType: inspected.mimeType,
          checksum: inspected.checksum,
          metadata: {
            ...asObject(item.metadata),
            ...inspected.metadata,
          } as PrismaJson.MediaMetadata,
        };

        await db.$transaction(async (tx) => {
          await tx.media.update({ where: { id: item.id }, data });

          // The record answers "where are the bytes" for every later reader;
          // it must learn the metadata this run discovered.
          if (item.storedFile) {
            await updateStoredFileForMedia(tx, item.id, {
              contentType: inspected.mimeType,
              size: inspected.size,
              checksum: inspected.checksum,
            });
          }
        });
      }

      report.updated += 1;
      onProgress?.(
        `${dryRun ? "would update" : "update"} ${item.id} (${inspected.mimeType}, ${inspected.metadata.width}x${inspected.metadata.height})`,
      );
    } catch (error) {
      report.failed.push({
        mediaId: item.id,
        name: item.name,
        reason: describeBackfillFailure(error),
      });
      onProgress?.(`fail ${item.id}: ${describeBackfillFailure(error)}`);
    }
  });

  return report;
}
