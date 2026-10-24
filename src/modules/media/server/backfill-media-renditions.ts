import "server-only";

import { MediaType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { storageKeyFromMediaUrl } from "@/modules/media/lib/url";

import { describeBackfillFailure } from "./backfill-failure";
import { forEachWithConcurrency } from "./bounded-concurrency";
import { checksumOf } from "./image-bytes";
import {
  isMediaRevisionKey,
  mediaRevisionPrefix,
  storedImageFields,
  writeImageRevision,
} from "./media-service";
import type { StorageDriver } from "./storage";

export interface MediaRenditionBackfillPending {
  mediaId: string;
  name: string;
}

export interface MediaRenditionBackfillFailure
  extends MediaRenditionBackfillPending {
  reason: string;
}

export interface MediaRenditionBackfillReport {
  /** Image Media examined in this run. */
  scanned: number;
  /** Media whose missing renditions were generated. */
  processed: number;
  /** Media that already had a rendition manifest and were left untouched. */
  skipped: number;
  /** Work found at the start of the run. Dry-run returns the list unchanged. */
  pending: MediaRenditionBackfillPending[];
  /** Sources that could not be reached or decoded, each with its reason. */
  failed: MediaRenditionBackfillFailure[];
  dryRun: boolean;
}

export interface MediaRenditionBackfillOptions {
  driver: StorageDriver;
  /** Limit the run to specific Media ids. Used by tests and by retries. */
  mediaIds?: string[];
  concurrency?: number;
  dryRun?: boolean;
  onProgress?: (line: string) => void;
}

type RenditionBackfillMedia = {
  id: string;
  name: string;
  key: string | null;
  url: string;
  revision: number;
  archivedAt: Date | null;
  renditions: unknown;
};

/**
 * Image processing is CPU-bound and shares a 4-vCPU host with Postgres and the
 * application, so two sources at a time already saturate a quiet run.
 */
export const DEFAULT_RENDITION_BACKFILL_CONCURRENCY = 2;

function hasRenditionManifest(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Generates the rendition ladder for existing image Media that lack it.
 *
 * The job is idempotent: rows with a rendition manifest are skipped, and every
 * object is written under `<mediaId>/<revision>/`, so a second run neither
 * duplicates objects nor rewrites processed rows. A source that cannot be read
 * or decoded is reported and skipped without stopping the rest of the run.
 *
 * The source object is never deleted: legacy absolute URLs embedded in Puck,
 * TipTap, ad and email content still point at it, and the loader keeps serving
 * it until that content is migrated.
 */
export async function backfillMediaRenditions({
  driver,
  mediaIds,
  concurrency = DEFAULT_RENDITION_BACKFILL_CONCURRENCY,
  dryRun = false,
  onProgress,
}: MediaRenditionBackfillOptions): Promise<MediaRenditionBackfillReport> {
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
      revision: true,
      archivedAt: true,
      renditions: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const pending = media.filter((item) => !hasRenditionManifest(item.renditions));
  const report: MediaRenditionBackfillReport = {
    scanned: media.length,
    processed: 0,
    skipped: media.length - pending.length,
    pending: pending.map((item) => ({ mediaId: item.id, name: item.name })),
    failed: [],
    dryRun,
  };

  if (dryRun) {
    for (const item of pending) {
      onProgress?.(`pending ${item.id} (${item.name})`);
    }
    return report;
  }

  await forEachWithConcurrency(
    pending,
    concurrency,
    async (item: RenditionBackfillMedia) => {
      const sourceKey = item.key ?? storageKeyFromMediaUrl(item.url);

      if (!sourceKey) {
        const reason = "no readable storage key";
        report.failed.push({ mediaId: item.id, name: item.name, reason });
        onProgress?.(`fail ${item.id}: ${reason}`);
        return;
      }

      const sourceIsPartOfRevision = isMediaRevisionKey(
        item.id,
        item.revision,
        sourceKey,
      );

      try {
        const bytes = await driver.get(sourceKey);
        const stored = await writeImageRevision({
          driver,
          id: item.id,
          revision: item.revision,
          bytes,
          archived: item.archivedAt !== null,
          cleanupOnFailure: !sourceIsPartOfRevision,
        });

        try {
          await db.media.update({
            where: { id: item.id },
            data: storedImageFields(
              stored,
              item.revision,
              checksumOf(bytes),
            ),
          });
        } catch (error) {
          // The row never learned about the new objects. Remove them when the
          // prefix was empty before the run; when it held the delivered
          // original, leave it intact and let a retry overwrite the renditions.
          if (!sourceIsPartOfRevision) {
            await driver
              .deletePrefix(mediaRevisionPrefix(item.id, item.revision))
              .catch(() => undefined);
          }
          throw error;
        }

        report.processed += 1;
        onProgress?.(
          `process ${item.id} (${stored.renditions.length} renditions)`,
        );
      } catch (error) {
        const reason = describeBackfillFailure(error);
        report.failed.push({ mediaId: item.id, name: item.name, reason });
        onProgress?.(`fail ${item.id}: ${reason}`);
      }
    },
  );

  return report;
}
