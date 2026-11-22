import "server-only";

import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { storedFilePath } from "@/modules/media/lib/file-path";
import {
  decodeMediaManifest,
  MEDIA_MANIFEST_PARAM,
} from "@/modules/media/lib/manifest";
import { mediaRenditionLocations } from "@/modules/media/lib/renditions";
import { mediaSourceKey, parseSrc } from "@/modules/media/lib/url";

import { describeBackfillFailure } from "./backfill-failure";
import { recordedStorageDriverName } from "./storage";

export interface ManifestUrlBackfillPending {
  mediaId: string;
  name: string;
}

export interface ManifestUrlBackfillFailure
  extends ManifestUrlBackfillPending {
  reason: string;
}

export interface ManifestUrlBackfillReport {
  /** Media examined in this run. */
  scanned: number;
  /** Media whose rendition manifest learned its addresses. */
  updated: number;
  /** Media that already carried every address, or has no manifest. */
  skipped: number;
  failed: ManifestUrlBackfillFailure[];
  dryRun: boolean;
}

export interface ManifestUrlBackfillOptions {
  /** Limit the run to specific Media ids. Used by tests and by retries. */
  mediaIds?: string[];
  dryRun?: boolean;
  onProgress?: (line: string) => void;
}

const manifestBackfillMediaSelect = {
  id: true,
  name: true,
  key: true,
  url: true,
  storageDriver: true,
  renditions: true,
  storedFile: { select: { key: true, driver: true } },
} satisfies Prisma.MediaSelect;

type ManifestBackfillMedia = Prisma.MediaGetPayload<{
  select: typeof manifestBackfillMediaSelect;
}>;

/**
 * The address each rendition of the row already knows: the one its manifest
 * entry carries, otherwise the one the `?mt=` token of its delivery address
 * was written with.
 */
function knownAddresses(media: ManifestBackfillMedia): Map<string, string> {
  const addresses = new Map<string, string>();

  for (const rendition of mediaRenditionLocations(media.renditions)) {
    if (rendition.url) {
      addresses.set(rendition.key, rendition.url);
    }
  }

  if (!media.url) return addresses;

  const token = parseSrc(media.url).url.searchParams.get(MEDIA_MANIFEST_PARAM);
  for (const rendition of decodeMediaManifest(token)?.renditions ?? []) {
    const key = `${rendition.width}:${rendition.format}`;
    if (!addresses.has(key)) addresses.set(key, rendition.url);
  }

  return addresses;
}

/**
 * Copies each existing Media's rendition addresses out of its delivery token
 * and into `renditions`, the manifest that survives once the token's column is
 * dropped.
 *
 * The run is idempotent: a row whose entries already carry an address is
 * skipped. A remote row whose token does not name one of its renditions cannot
 * be delivered without asking the provider, so it is reported and left
 * untouched rather than half-written. The command never moves bytes and never
 * changes an address.
 */
export async function backfillMediaManifestUrls({
  mediaIds,
  dryRun = false,
  onProgress,
}: ManifestUrlBackfillOptions = {}): Promise<ManifestUrlBackfillReport> {
  const report: ManifestUrlBackfillReport = {
    scanned: 0,
    updated: 0,
    skipped: 0,
    failed: [],
    dryRun,
  };

  // The command runs from the release that still has `Media.url`; a restart of
  // that container after the contraction must not fail on a column that is
  // gone, so an already-contracted schema is a no-op rather than an error.
  const [column] = await db.$queryRaw<{ present: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'Media'
        AND column_name = 'url'
    ) AS present
  `;

  if (!column?.present) {
    onProgress?.(
      "skip: the Media.url column is gone, so the contraction has already run",
    );
    return report;
  }

  const media = await db.media.findMany({
    where: mediaIds ? { id: { in: mediaIds } } : undefined,
    select: manifestBackfillMediaSelect,
    orderBy: { createdAt: "asc" },
  });

  report.scanned = media.length;

  for (const item of media) {
    const renditions = mediaRenditionLocations(item.renditions);
    if (renditions.length === 0) {
      report.skipped += 1;
      onProgress?.(`skip ${item.id}: no rendition manifest`);
      continue;
    }

    try {
      const known = knownAddresses(item);
      const driver = recordedStorageDriverName(
        item.storedFile?.driver ?? item.storageDriver,
      );
      const key = item.storedFile?.key ?? mediaSourceKey(item);

      const entries: Array<Record<string, unknown>> = [];
      let complete = true;

      for (const rendition of renditions) {
        const url =
          known.get(rendition.key) ??
          known.get(`${rendition.width}:${rendition.format}`) ??
          (driver === "local" && key
            ? storedFilePath("MEDIA", rendition.key)
            : null);

        if (!url) complete = false;

        entries.push(url ? { ...rendition, url } : { ...rendition });
      }

      if (!complete) {
        const reason =
          "a rendition has no recorded address and the row is remote";
        report.failed.push({ mediaId: item.id, name: item.name, reason });
        onProgress?.(`fail ${item.id}: ${reason}`);
        continue;
      }

      const unchanged = renditions.every(
        (rendition) => typeof rendition.url === "string",
      );

      if (unchanged) {
        report.skipped += 1;
        onProgress?.(`skip ${item.id}: already recorded`);
        continue;
      }

      if (!dryRun) {
        await db.media.update({
          where: { id: item.id },
          data: {
            renditions: entries as unknown as PrismaJson.MediaRenditions,
          },
        });
      }

      report.updated += 1;
      onProgress?.(`${dryRun ? "would update" : "update"} ${item.id}`);
    } catch (error) {
      const reason = describeBackfillFailure(error);
      report.failed.push({ mediaId: item.id, name: item.name, reason });
      onProgress?.(`fail ${item.id}: ${reason}`);
    }
  }

  return report;
}
