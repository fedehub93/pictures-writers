import "server-only";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { db } from "@/shared/lib/db";

import { mediaUsageBytes } from "@/modules/media/lib/quota";
import { mediaSourceKey } from "@/modules/media/lib/url";

import {
  getLocalStorageRoot,
  resolveMediaDriverName,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";

/**
 * Why a Media cannot be resolved through the driver recorded on it. Machine
 * readable and deliberately free of keys, addresses and content: the report is
 * pasted into deployment logs.
 *
 * - `unknown-driver`: the row records a driver name this build does not know.
 * - `driver-unconfigured`: that driver exists, but this instance has no
 *   credentials for it. A row with no recorded driver resolves as legacy
 *   UploadThing and lands here too when the token is absent.
 * - `no-storage-key`: the row's key can be read neither from its column nor
 *   from its address, so no driver can find the object.
 * - `object-missing`: a key the row accounts for is absent from the local
 *   volume.
 */
export type MediaAuditUnresolvedReason =
  | "unknown-driver"
  | "driver-unconfigured"
  | "no-storage-key"
  | "object-missing";

export interface MediaAuditUnresolved {
  mediaId: string;
  reason: MediaAuditUnresolvedReason;
}

/**
 * A recorded driver name, `unrecorded` for pre-seam rows that resolve as
 * legacy UploadThing, or `unknown` for a name this build does not know.
 */
export type MediaAuditDriverKey = StorageDriverName | "unrecorded" | "unknown";

export interface MediaAuditDriverCount {
  driver: MediaAuditDriverKey;
  media: number;
}

export interface MediaAuditReport {
  /** Media examined. */
  media: number;
  /** How many Media each driver wrote. Sorted by driver name. */
  drivers: MediaAuditDriverCount[];
  /** Recorded drivers this instance cannot reach, sorted. */
  unconfiguredDrivers: StorageDriverName[];
  /** Media that do not resolve through their recorded driver, sorted by id. */
  unresolved: MediaAuditUnresolved[];
  bytes: {
    /** Every Media, all drivers: the original's size plus its renditions. */
    accounted: number;
    /** Media recorded against the local driver. */
    localAccounted: number;
    /** Regular files under the local volume root. */
    localOnDisk: number;
    /** `localOnDisk - localAccounted`: positive means more bytes than accounted for. */
    localDifference: number;
  };
  objects: {
    /** Local object keys the database accounts for: originals and renditions. */
    accounted: number;
    /** Object files under the local volume root. */
    onDisk: number;
    /** Accounted keys that are absent from the volume. */
    missing: number;
    /** Files on the volume that no local row accounts for. */
    orphaned: number;
  };
}

export interface MediaAuditOptions {
  /** Resolves each row's recorded driver; defaults to the process env. */
  env?: StorageEnvironment;
  /** The local volume root; defaults to `MEDIA_STORAGE_LOCAL_ROOT`. */
  localRoot?: string;
  /** Limit the audit to specific Media ids. Used by tests and by retries. */
  mediaIds?: string[];
}

type AuditMedia = {
  id: string;
  key: string | null;
  url: string;
  storageDriver: string | null;
  size: number | null;
  renditions: unknown;
};

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

/**
 * Every regular file under the local root, keyed the same way the local
 * driver names a storage key. A root that does not exist yet is an empty
 * volume, not an error.
 */
async function readLocalVolume(root: string): Promise<Map<string, number>> {
  const files = new Map<string, number>();

  async function visit(directory: string, prefix: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (isMissingFile(error)) return;
      throw error;
    }

    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(entryPath, relative);
        continue;
      }

      if (!entry.isFile()) continue;

      try {
        files.set(relative, (await stat(entryPath)).size);
      } catch (error) {
        // A file removed while the audit runs is simply not on disk.
        if (!isMissingFile(error)) throw error;
      }
    }
  }

  await visit(root, "");

  return files;
}

function renditionKeys(media: AuditMedia): string[] {
  if (!Array.isArray(media.renditions)) return [];

  const keys: string[] = [];
  for (const rendition of media.renditions) {
    if (typeof rendition !== "object" || rendition === null) continue;

    const key = (rendition as { key?: unknown }).key;
    if (typeof key === "string" && key.length > 0) keys.push(key);
  }

  return keys;
}

/**
 * A read-only health check of the media library after a storage change.
 *
 * It answers four questions and writes nothing: how many Media each driver
 * wrote, which Media cannot be resolved through the driver recorded on them,
 * which recorded drivers are not configured here, and how the bytes on the
 * local volume compare with the bytes the database accounts for. Local rows
 * are verified object by object against the volume; remote rows are verified
 * only through their driver's configuration and key grammar, because a
 * read-only command must not fetch every provider object.
 *
 * The report carries Media ids and aggregates, never storage keys, addresses
 * or content.
 */
export async function auditMediaLibrary({
  env = process.env,
  localRoot,
  mediaIds,
}: MediaAuditOptions = {}): Promise<MediaAuditReport> {
  const media = await db.media.findMany({
    where: mediaIds ? { id: { in: mediaIds } } : undefined,
    select: {
      id: true,
      key: true,
      url: true,
      storageDriver: true,
      size: true,
      renditions: true,
    },
    orderBy: { id: "asc" },
  });

  const driverCounts = new Map<MediaAuditDriverKey, number>();
  const unconfiguredDrivers = new Set<StorageDriverName>();
  const unresolved: MediaAuditUnresolved[] = [];
  const localRows: AuditMedia[] = [];
  /** Accounting key -> the Media that accounts for it. */
  const accountedKeys = new Map<string, string>();

  for (const row of media) {
    const resolution = resolveMediaDriverName(row.storageDriver, env);
    const driverKey: MediaAuditDriverKey =
      row.storageDriver === null
        ? "unrecorded"
        : (resolution.name ?? "unknown");

    driverCounts.set(driverKey, (driverCounts.get(driverKey) ?? 0) + 1);

    if (!resolution.resolved) {
      if (resolution.name === null) {
        unresolved.push({ mediaId: row.id, reason: "unknown-driver" });
      } else {
        unconfiguredDrivers.add(resolution.name);
        unresolved.push({ mediaId: row.id, reason: "driver-unconfigured" });
      }
      continue;
    }

    if (resolution.name !== "local") {
      if (mediaSourceKey(row) === null) {
        unresolved.push({ mediaId: row.id, reason: "no-storage-key" });
      }
      continue;
    }

    localRows.push(row);

    const key = mediaSourceKey(row);
    if (key === null) {
      unresolved.push({ mediaId: row.id, reason: "no-storage-key" });
      continue;
    }

    accountedKeys.set(key, row.id);
    for (const renditionKey of renditionKeys(row)) {
      accountedKeys.set(renditionKey, row.id);
    }
  }

  const onDisk = await readLocalVolume(
    localRoot ?? getLocalStorageRoot(env),
  );

  const missingMediaIds = new Set<string>();
  let missingObjects = 0;
  for (const [key, mediaId] of accountedKeys) {
    if (onDisk.has(key)) continue;

    missingObjects += 1;
    missingMediaIds.add(mediaId);
  }

  for (const mediaId of missingMediaIds) {
    unresolved.push({ mediaId, reason: "object-missing" });
  }

  let orphanedObjects = 0;
  for (const key of onDisk.keys()) {
    if (!accountedKeys.has(key)) orphanedObjects += 1;
  }

  const localAccounted = mediaUsageBytes(localRows);
  const localOnDisk = [...onDisk.values()].reduce(
    (total, bytes) => total + bytes,
    0,
  );

  return {
    media: media.length,
    drivers: [...driverCounts]
      .map(([driver, count]) => ({ driver, media: count }))
      .sort((a, b) => a.driver.localeCompare(b.driver)),
    unconfiguredDrivers: [...unconfiguredDrivers].sort(),
    unresolved: unresolved.sort((a, b) => a.mediaId.localeCompare(b.mediaId)),
    bytes: {
      accounted: mediaUsageBytes(media),
      localAccounted,
      localOnDisk,
      localDifference: localOnDisk - localAccounted,
    },
    objects: {
      accounted: accountedKeys.size,
      onDisk: onDisk.size,
      missing: missingObjects,
      orphaned: orphanedObjects,
    },
  };
}

/**
 * The process exit code for a finished audit: any Media that does not resolve
 * through its recorded driver fails the command, so it can gate a deployment.
 * Orphaned files are reported but do not fail it — every Media still resolves.
 */
export function mediaAuditExitCode(
  report: Pick<MediaAuditReport, "unresolved">,
): number {
  return report.unresolved.length > 0 ? 1 : 0;
}

/**
 * The operator-facing lines for one audit. Media ids and aggregates only: a
 * key, an address or a name must never reach the deployment log.
 */
export function formatMediaAuditReport(report: MediaAuditReport): string[] {
  const drivers =
    report.drivers.length > 0
      ? report.drivers.map(({ driver, media }) => `${driver}=${media}`).join(" ")
      : "none";

  const lines = [
    `media: ${report.media}`,
    `drivers: ${drivers}`,
    `unconfigured drivers: ${
      report.unconfiguredDrivers.length > 0
        ? report.unconfiguredDrivers.join(" ")
        : "none"
    }`,
    `bytes: accounted=${report.bytes.accounted} localAccounted=${report.bytes.localAccounted} localOnDisk=${report.bytes.localOnDisk} localDifference=${report.bytes.localDifference}`,
    `objects: accounted=${report.objects.accounted} onDisk=${report.objects.onDisk} missing=${report.objects.missing} orphaned=${report.objects.orphaned}`,
    `unresolved: ${report.unresolved.length}`,
  ];

  for (const { mediaId, reason } of report.unresolved) {
    lines.push(`  ${mediaId} ${reason}`);
  }

  return lines;
}
