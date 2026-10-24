import "server-only";

import { MediaType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { storageKeyFromMediaUrl } from "@/modules/media/lib/url";

import { describeBackfillFailure } from "./backfill-failure";
import { forEachWithConcurrency } from "./bounded-concurrency";
import { inspectImage } from "./inspect-image";
import type { StorageDriver } from "./storage";

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
  driver: StorageDriver;
  /** Limit the run to specific Media ids. Used by tests and by retries. */
  mediaIds?: string[];
  concurrency?: number;
  dryRun?: boolean;
  onProgress?: (line: string) => void;
}

type BackfillMedia = {
  id: string;
  name: string;
  key: string | null;
  url: string;
  mimeType: string | null;
  size: number | null;
  checksum: string | null;
  metadata: unknown;
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function hasCompleteMetadata(media: BackfillMedia): boolean {
  const metadata = asObject(media.metadata);

  return (
    typeof media.mimeType === "string" &&
    media.mimeType.length > 0 &&
    typeof media.size === "number" &&
    media.size > 0 &&
    typeof media.checksum === "string" &&
    media.checksum.length > 0 &&
    typeof metadata.width === "number" &&
    typeof metadata.height === "number" &&
    typeof metadata.blurDataURL === "string" &&
    metadata.blurDataURL.startsWith("data:")
  );
}


/**
 * Fills the metadata of every image Media that is missing it. It only writes
 * derived columns, so running it again is a no-op for already-processed rows.
 * Unreachable sources are reported and skipped, never fatal.
 */
export async function backfillMediaMetadata({
  driver,
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
    select: {
      id: true,
      name: true,
      key: true,
      url: true,
      mimeType: true,
      size: true,
      checksum: true,
      metadata: true,
    },
    orderBy: { createdAt: "asc" },
  });

  report.scanned = media.length;

  await forEachWithConcurrency(media, concurrency, async (item) => {
    if (hasCompleteMetadata(item)) {
      report.skipped += 1;
      onProgress?.(`skip ${item.id}: already described`);
      return;
    }

    try {
      const key = item.key ?? storageKeyFromMediaUrl(item.url);

      if (!key) {
        report.failed.push({
          mediaId: item.id,
          name: item.name,
          reason: "no readable storage key",
        });
        onProgress?.(`fail ${item.id}: no readable storage key`);
        return;
      }

      const bytes = await driver.get(key);
      const inspected = await inspectImage(bytes);

      if (!dryRun) {
        await db.media.update({
          where: { id: item.id },
          data: {
            size: inspected.size,
            mimeType: inspected.mimeType,
            checksum: inspected.checksum,
            metadata: {
              ...asObject(item.metadata),
              ...inspected.metadata,
            } as PrismaJson.MediaMetadata,
          },
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
