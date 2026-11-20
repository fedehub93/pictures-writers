import "server-only";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  mediaUsageBytes,
  type MediaQuotaUsageRow,
} from "@/modules/media/lib/quota";
import { STORAGE_DRIVERS } from "@/modules/media/lib/storage-driver";

import {
  getLocalStorageRoot,
  isStorageDriverConfigured,
  resolveMediaDriverName,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";

/**
 * Why a stored file cannot be resolved through its recorded driver. Machine
 * readable and deliberately free of keys, addresses and content: the report is
 * pasted into deployment logs.
 *
 * - `unknown-driver`: the file records a driver name this build does not know.
 * - `driver-unconfigured`: that driver exists, but this instance has no
 *   credentials for it.
 * - `no-storage-key`: the record names no object, so no driver can find it.
 * - `no-stored-file`: the Media has no stored-file record yet. The one-time
 *   location backfill creates it; until then nothing answers where the bytes
 *   are.
 * - `object-missing`: a key the file accounts for is absent from the local
 *   volume.
 */
export type MediaAuditUnresolvedReason =
  | "unknown-driver"
  | "driver-unconfigured"
  | "no-storage-key"
  | "no-stored-file"
  | "object-missing";

export interface MediaAuditUnresolved {
  /** The stored file's id, or the Media's id when it has no record yet. */
  id: string;
  reason: MediaAuditUnresolvedReason;
}

/**
 * A recorded driver name, or `unknown` for a name this build does not know.
 */
export type MediaAuditDriverKey = StorageDriverName | "unknown";

export interface MediaAuditDriverCount {
  driver: MediaAuditDriverKey;
  files: number;
}

export interface MediaAuditReport {
  /** Stored files examined. */
  files: number;
  /** How many files each driver wrote. Sorted by driver name. */
  drivers: MediaAuditDriverCount[];
  /** Drivers this instance can reach, sorted. */
  configuredDrivers: StorageDriverName[];
  /** Recorded drivers this instance cannot reach, sorted. */
  unconfiguredDrivers: StorageDriverName[];
  /** Files that do not resolve, sorted by id. */
  unresolved: MediaAuditUnresolved[];
  bytes: {
    /** Every file, all drivers: the original's size plus its renditions. */
    accounted: number;
    /** Files recorded against the local driver. */
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
    /** Files on the volume that no local file accounts for. */
    orphaned: number;
  };
}

export interface MediaAuditOptions {
  /** Resolves each file's recorded driver; defaults to the process env. */
  env?: StorageEnvironment;
  /** The local volume root; defaults to `MEDIA_STORAGE_LOCAL_ROOT`. */
  localRoot?: string;
  /** Limit the audit to files owned by specific Media ids. Used by tests. */
  mediaIds?: string[];
}

const auditFileSelect = {
  id: true,
  key: true,
  driver: true,
  size: true,
  media: { select: { id: true, renditions: true } },
} satisfies Prisma.StoredFileSelect;

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

function renditionKeys(renditions: unknown): string[] {
  if (!Array.isArray(renditions)) return [];

  const keys: string[] = [];
  for (const rendition of renditions) {
    if (typeof rendition !== "object" || rendition === null) continue;

    const key = (rendition as { key?: unknown }).key;
    if (typeof key === "string" && key.length > 0) keys.push(key);
  }

  return keys;
}

/**
 * A read-only health check of the storage library after a storage change.
 *
 * It reads every stored file and answers, without writing: how many files each
 * driver wrote, which files cannot be resolved through the driver recorded on
 * them, which drivers this instance can reach and which recorded ones it
 * cannot, and how the bytes on the local volume compare with the bytes the
 * database accounts for. A Media without a stored-file record is reported
 * too, so the audit fails until the one-time location backfill has run. Local
 * files are verified object by object against the volume; remote files are
 * verified only through their driver's configuration and key grammar, because
 * a read-only command must not fetch every provider object.
 *
 * The report carries file ids and aggregates, never storage keys, addresses
 * or content.
 */
export async function auditMediaLibrary({
  env = process.env,
  localRoot,
  mediaIds,
}: MediaAuditOptions = {}): Promise<MediaAuditReport> {
  const [files, unrecordedMedia] = await Promise.all([
    db.storedFile.findMany({
      where: mediaIds ? { mediaId: { in: mediaIds } } : undefined,
      select: auditFileSelect,
      orderBy: { id: "asc" },
    }),
    db.media.findMany({
      where: {
        ...(mediaIds ? { id: { in: mediaIds } } : {}),
        storedFile: null,
      },
      select: { id: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const driverCounts = new Map<MediaAuditDriverKey, number>();
  const unconfiguredDrivers = new Set<StorageDriverName>();
  const unresolved: MediaAuditUnresolved[] = [];
  const localFiles: MediaQuotaUsageRow[] = [];
  const accountedFiles: MediaQuotaUsageRow[] = [];
  /** Accounting key -> the stored file that accounts for it. */
  const accountedKeys = new Map<string, string>();

  for (const file of files) {
    const resolution = resolveMediaDriverName(file.driver, env);
    const driverKey: MediaAuditDriverKey = resolution.name ?? "unknown";
    const renditions = file.media?.renditions ?? null;

    driverCounts.set(driverKey, (driverCounts.get(driverKey) ?? 0) + 1);
    accountedFiles.push({ size: file.size, renditions });

    if (!resolution.resolved) {
      if (resolution.name === null) {
        unresolved.push({ id: file.id, reason: "unknown-driver" });
      } else {
        unconfiguredDrivers.add(resolution.name);
        unresolved.push({ id: file.id, reason: "driver-unconfigured" });
      }
      continue;
    }

    const local = resolution.name === "local";
    if (local) localFiles.push({ size: file.size, renditions });

    if (file.key.length === 0) {
      unresolved.push({ id: file.id, reason: "no-storage-key" });
      continue;
    }

    if (!local) continue;

    accountedKeys.set(file.key, file.id);
    for (const renditionKey of renditionKeys(renditions)) {
      accountedKeys.set(renditionKey, file.id);
    }
  }

  for (const media of unrecordedMedia) {
    unresolved.push({ id: media.id, reason: "no-stored-file" });
  }

  const onDisk = await readLocalVolume(
    localRoot ?? getLocalStorageRoot(env),
  );

  const missingFileIds = new Set<string>();
  let missingObjects = 0;
  for (const [key, fileId] of accountedKeys) {
    if (onDisk.has(key)) continue;

    missingObjects += 1;
    missingFileIds.add(fileId);
  }

  for (const fileId of missingFileIds) {
    unresolved.push({ id: fileId, reason: "object-missing" });
  }

  let orphanedObjects = 0;
  for (const key of onDisk.keys()) {
    if (!accountedKeys.has(key)) orphanedObjects += 1;
  }

  const localAccounted = mediaUsageBytes(localFiles);
  const localOnDisk = [...onDisk.values()].reduce(
    (total, bytes) => total + bytes,
    0,
  );

  return {
    files: files.length,
    drivers: [...driverCounts]
      .map(([driver, count]) => ({ driver, files: count }))
      .sort((a, b) => a.driver.localeCompare(b.driver)),
    configuredDrivers: STORAGE_DRIVERS.filter((name) =>
      isStorageDriverConfigured(name, env),
    ),
    unconfiguredDrivers: [...unconfiguredDrivers].sort(),
    unresolved: unresolved.sort((a, b) => a.id.localeCompare(b.id)),
    bytes: {
      accounted: mediaUsageBytes(accountedFiles),
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
 * The process exit code for a finished audit: any file that does not resolve
 * through its recorded driver fails the command, so it can gate a deployment.
 * Orphaned files are reported but do not fail it — every file still resolves.
 */
export function mediaAuditExitCode(
  report: Pick<MediaAuditReport, "unresolved">,
): number {
  return report.unresolved.length > 0 ? 1 : 0;
}

function listDrivers(drivers: StorageDriverName[]): string {
  return drivers.length > 0 ? drivers.join(" ") : "none";
}

/**
 * The operator-facing lines for one audit. File ids and aggregates only: a
 * key, an address or a name must never reach the deployment log.
 */
export function formatMediaAuditReport(report: MediaAuditReport): string[] {
  const drivers =
    report.drivers.length > 0
      ? report.drivers.map(({ driver, files }) => `${driver}=${files}`).join(" ")
      : "none";

  const lines = [
    `files: ${report.files}`,
    `drivers: ${drivers}`,
    `configured drivers: ${listDrivers(report.configuredDrivers)}`,
    `unconfigured drivers: ${listDrivers(report.unconfiguredDrivers)}`,
    `bytes: accounted=${report.bytes.accounted} localAccounted=${report.bytes.localAccounted} localOnDisk=${report.bytes.localOnDisk} localDifference=${report.bytes.localDifference}`,
    `objects: accounted=${report.objects.accounted} onDisk=${report.objects.onDisk} missing=${report.objects.missing} orphaned=${report.objects.orphaned}`,
    `unresolved: ${report.unresolved.length}`,
  ];

  for (const { id, reason } of report.unresolved) {
    lines.push(`  ${id} ${reason}`);
  }

  return lines;
}
