import "server-only";

import { db } from "@/shared/lib/db";

import {
  auditMediaLibrary,
  mediaAuditExitCode,
} from "./media-audit";
import {
  driverForStorageDriver,
  isStorageDriverConfigured,
  StorageObjectNotFoundError,
  type StorageDriver,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";

/** The recovery window a journal entry waits out before the purge may delete it. */
export const DEFAULT_PURGE_GRACE_DAYS = 7;

export const DEFAULT_PURGE_GRACE_MS =
  DEFAULT_PURGE_GRACE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Why the purge refuses to start. Nothing is deleted on any of these paths.
 *
 * - `not-a-provider`: only a provider can be retired. A local object is removed
 *   by the operation that abandoned it, so the journal never names one.
 * - `driver-unconfigured`: this instance has no credentials for the driver, so
 *   it cannot prove it deleted the object.
 * - `files-on-driver`: some stored file still records that driver, so deleting
 *   its objects would darken that file.
 * - `audit-not-green`: a file does not resolve through its recorded driver, so
 *   the installation cannot prove the move is complete.
 */
export type PurgeRefusalReason =
  | "not-a-provider"
  | "driver-unconfigured"
  | "files-on-driver"
  | "audit-not-green";

export class PurgeRefusedError extends Error {
  readonly code = "PURGE_REFUSED";

  constructor(readonly reason: PurgeRefusalReason, message: string) {
    super(message);
    this.name = "PurgeRefusedError";
  }
}

export class PurgeConfirmationRequiredError extends Error {
  readonly code = "PURGE_CONFIRMATION_REQUIRED";

  constructor(readonly driver: StorageDriverName) {
    super(
      `Type the driver name "${driver}" to confirm the purge. Nothing was deleted.`,
    );
    this.name = "PurgeConfirmationRequiredError";
  }
}

/**
 * Why one journal entry is still there. Machine readable and free of keys and
 * addresses, so a report is safe to paste into a deployment log.
 *
 * - `delete-failed`: the provider refused the delete, so the object may remain.
 * - `journal-failed`: the object is gone, but its journal entry could not be
 *   removed; the next run retries and finds nothing left to delete.
 */
export type PurgeFailureReason = "delete-failed" | "journal-failed";

export interface PurgeFailure {
  /** The journal entry; the object's key never enters the report. */
  entryId: string;
  reason: PurgeFailureReason;
}

export interface PurgeReport {
  driver: StorageDriverName;
  /** Journal entries the driver had when the run started. */
  entries: number;
  /** Entries old enough for this run to act on. */
  eligible: number;
  /** Objects the run removed, or found already absent. */
  deleted: number;
  /** Entries younger than the grace window, left for a later run. */
  waiting: number;
  /** Bytes the removed objects recorded; an unknown size counts zero. */
  bytesDeleted: number;
  failed: PurgeFailure[];
}

export interface PendingPurgeDriver {
  driver: string;
  entries: number;
  eligible: number;
  waiting: number;
  bytes: number;
}

export interface PurgeOptions {
  /** The provider whose journal entries are deleted. */
  driver: StorageDriverName;
  /**
   * What the operator typed, or how the command asks for it. The callback runs
   * only after every guard has passed, so a refusal never asks for a
   * confirmation; only the driver name itself opens the purge.
   */
  confirmation?: string | (() => Promise<string>);
  env?: StorageEnvironment;
  /** Overrides the seven-day recovery window. */
  graceMs?: number;
  /** The clock the grace window is measured against. */
  now?: Date;
  /** Test seam: a real driver client instead of one built from the environment. */
  drivers?: Partial<Record<StorageDriverName, StorageDriver>>;
}

function assertDriverMayBePurged(
  driver: StorageDriverName,
  env: StorageEnvironment,
): void {
  if (driver === "local") {
    throw new PurgeRefusedError(
      "not-a-provider",
      "The purge retires a provider. A local object is removed by the operation that abandons it, so the journal never names the local driver.",
    );
  }

  if (!isStorageDriverConfigured(driver, env)) {
    throw new PurgeRefusedError(
      "driver-unconfigured",
      `The "${driver}" driver is not configured on this instance, so its objects cannot be deleted.`,
    );
  }
}

/**
 * The journal grouped by driver: what a purge could delete, and how much is
 * still inside its recovery window. Read-only, so the command can print the
 * choice before it asks the owner to type a confirmation.
 */
export async function pendingPurge({
  now = new Date(),
  graceMs = DEFAULT_PURGE_GRACE_MS,
}: { now?: Date; graceMs?: number } = {}): Promise<PendingPurgeDriver[]> {
  const entries = await db.storagePurgeEntry.findMany({
    select: { driver: true, size: true, createdAt: true },
  });

  const cutoff = now.getTime() - graceMs;
  const byDriver = new Map<string, PendingPurgeDriver>();

  for (const entry of entries) {
    const summary = byDriver.get(entry.driver) ?? {
      driver: entry.driver,
      entries: 0,
      eligible: 0,
      waiting: 0,
      bytes: 0,
    };

    summary.entries += 1;
    summary.bytes += entry.size ?? 0;
    if (entry.createdAt.getTime() >= cutoff) summary.waiting += 1;

    byDriver.set(entry.driver, summary);
  }

  return [...byDriver.values()]
    .map((summary) => ({
      ...summary,
      eligible: summary.entries - summary.waiting,
    }))
    .sort((a, b) => a.driver.localeCompare(b.driver));
}

/**
 * Deletes exactly the provider objects a Re-home recorded in the purge journal,
 * and nothing else.
 *
 * It refuses unless the operator typed the driver's name, no stored file still
 * records that driver, and the audit is green: those are the proofs that the
 * move is complete before the recovery window is moot. Entries younger than the
 * grace window are left alone and reported as waiting; the command is never
 * automatic. One object's provider failure is reported by journal entry and the
 * rest of the batch continues, so a transient error never strands the run.
 */
export async function purgeStorageObjects({
  driver,
  confirmation,
  env = process.env,
  graceMs = DEFAULT_PURGE_GRACE_MS,
  now = new Date(),
  drivers: supplied,
}: PurgeOptions): Promise<PurgeReport> {
  const cutoff = new Date(now.getTime() - graceMs);
  const [entries, waiting] = await Promise.all([
    db.storagePurgeEntry.findMany({
      where: { driver, createdAt: { lt: cutoff } },
      orderBy: { createdAt: "asc" },
    }),
    db.storagePurgeEntry.count({
      where: { driver, createdAt: { gte: cutoff } },
    }),
  ]);

  const report: PurgeReport = {
    driver,
    entries: entries.length + waiting,
    eligible: entries.length,
    deleted: 0,
    waiting,
    bytesDeleted: 0,
    failed: [],
  };

  // Nothing eligible means nothing to delete: a later run after the token is
  // gone, or while the library is red, still reports zero instead of refusing
  // a deletion it would not perform.
  if (entries.length === 0) return report;

  assertDriverMayBePurged(driver, env);

  const filesOnDriver = await db.storedFile.count({ where: { driver } });
  if (filesOnDriver > 0) {
    throw new PurgeRefusedError(
      "files-on-driver",
      `${filesOnDriver} stored files still record the "${driver}" driver. Re-home them before removing the provider's copies.`,
    );
  }

  const audit = await auditMediaLibrary({ env });
  if (mediaAuditExitCode(audit) !== 0) {
    throw new PurgeRefusedError(
      "audit-not-green",
      `The media audit reports ${audit.unresolved.length} unresolved files. Run "npm run media:audit" and fix every file before removing provider copies.`,
    );
  }

  // The guards run first, so a refused purge never asks the operator to type a
  // confirmation for a deletion it would then decline.
  const typed =
    typeof confirmation === "function" ? await confirmation() : confirmation;
  if (typed?.trim() !== driver) {
    throw new PurgeConfirmationRequiredError(driver);
  }

  const client = supplied?.[driver] ?? driverForStorageDriver(driver, env);

  for (const entry of entries) {
    // A newer move back onto the driver removes the journal entry in its flip,
    // which is what makes the key live again. Re-read it so a stale snapshot
    // can never delete bytes the library now serves.
    const stillJournaled = await db.storagePurgeEntry.findUnique({
      where: { id: entry.id },
      select: { id: true },
    });
    if (!stillJournaled) continue;

    try {
      await client.delete(entry.key);
    } catch (error) {
      // An object the provider no longer has is already in the state the purge
      // exists to reach, so its journal entry can go.
      if (!(error instanceof StorageObjectNotFoundError)) {
        report.failed.push({ entryId: entry.id, reason: "delete-failed" });
        continue;
      }
    }

    try {
      await db.storagePurgeEntry.deleteMany({ where: { id: entry.id } });
    } catch {
      report.failed.push({ entryId: entry.id, reason: "journal-failed" });
      continue;
    }

    report.deleted += 1;
    report.bytesDeleted += entry.size ?? 0;
  }

  return report;
}
