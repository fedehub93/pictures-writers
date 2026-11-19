import "server-only";

import { MediaType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { mediaSourceKey } from "@/modules/media/lib/url";

import { describeBackfillFailure } from "./backfill-failure";
import { forEachWithConcurrency } from "./bounded-concurrency";
import { checksumOf } from "./image-bytes";
import { isMediaRevisionKey, mediaRevisionPrefix } from "./media-key";
import { storedImageFields, writeImageRevision } from "./media-service";
import {
  getInstallationSlug,
  resolveMediaStorageDriver,
  type ResolvedStorageDriver,
  type StorageDriver,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";

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
  /**
   * Rows that could not be processed or reached, each with its reason. A dry
   * run never reads a source, so it reports only the rows whose recorded
   * driver this instance cannot resolve.
   */
  failed: MediaRenditionBackfillFailure[];
  dryRun: boolean;
}

export interface MediaRenditionBackfillOptions {
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

type RenditionBackfillMedia = {
  id: string;
  name: string;
  key: string | null;
  url: string;
  storageDriver: string | null;
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
 *
 * Every row is read and written through the driver recorded on it, so a
 * library that mixes legacy provider Media and Media written by another driver
 * is processed in one run. A driver this instance cannot reach is reported
 * with the row and the run continues.
 */
export async function backfillMediaRenditions({
  active,
  env = process.env,
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
      storageDriver: true,
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

  // One client per driver for the whole run, shared by every row it wrote.
  const drivers = new Map<StorageDriverName, StorageDriver>([
    [active.name, active.driver],
  ]);

  if (dryRun) {
    for (const item of pending) {
      // Resolving a driver writes nothing and reads no object, but it does
      // tell an operator before the run which rows this instance cannot serve.
      const resolution = resolveMediaStorageDriver(item.storageDriver, {
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
        continue;
      }

      onProgress?.(`pending ${item.id} (${item.name})`);
    }
    return report;
  }

  const installationSlug = getInstallationSlug(env);

  await forEachWithConcurrency(
    pending,
    concurrency,
    async (item: RenditionBackfillMedia) => {
      const sourceKey = mediaSourceKey(item);

      if (!sourceKey) {
        const reason = "no readable storage key";
        report.failed.push({ mediaId: item.id, name: item.name, reason });
        onProgress?.(`fail ${item.id}: ${reason}`);
        return;
      }

      try {
        const resolution = resolveMediaStorageDriver(item.storageDriver, {
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

        const driver = resolution.driver;
        const sourceIsPartOfRevision = isMediaRevisionKey(
          item.id,
          item.revision,
          sourceKey,
          installationSlug,
        );
        const bytes = await driver.get(sourceKey);
        const stored = await writeImageRevision({
          driver,
          id: item.id,
          revision: item.revision,
          installationSlug,
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
              .deletePrefix(
                mediaRevisionPrefix(item.id, item.revision, installationSlug),
              )
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
