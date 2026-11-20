/**
 * Re-home arithmetic.
 *
 * Client-safe and dependency-free: the library renders the space a move needs
 * from the same function the job refuses with, so the warning the admin reads
 * and the check the server enforces cannot drift.
 */

import { formatBytes } from "@/lib/format";

import type { StorageDriverName } from "./storage-driver";

/**
 * How much free space a move keeps beyond the bytes it copies. The copy is
 * written before the record flips, so the volume momentarily holds both the
 * old and the new objects; the headroom is what keeps the last files from
 * filling the disk mid-run.
 */
export const REHOME_HEADROOM_RATIO = 0.1;

export type RehomeLevel = "ok" | "warning" | "refused";

/**
 * Why a run cannot start, when it cannot. `disk` is the preflight refusing an
 * impossible copy; `target-unconfigured` is the active driver not being
 * reachable from this instance.
 */
export type RehomeBlockedReason = "disk" | "target-unconfigured";

export interface RehomePlan {
  target: StorageDriverName;
  /** Stored files whose recorded driver is not the target. */
  files: number;
  /** Original bytes plus rendition bytes those files account for. */
  bytes: number;
  /** `bytes` plus the move's headroom. */
  requiredBytes: number;
  /** Pending files whose original records no size, so `bytes` undercounts. */
  unknownFiles: number;
  /** Free bytes on the target volume; `null` for a provider or an unknown. */
  availableBytes: number | null;
  level: RehomeLevel;
  blockedReason: RehomeBlockedReason | null;
}

/** What the library shows, and what the plan is computed from. */
export interface PendingRehome {
  files: number;
  bytes: number;
  /** Files whose recorded size is unknown, so the estimate may be low. */
  unknownFiles: number;
}

/**
 * Why one stored file could not be moved. Machine readable and free of keys
 * and addresses, so a report is safe to paste into a deployment log.
 *
 * - `source-unconfigured`: the recorded driver is unknown here or has no
 *   credentials, so its bytes cannot be read.
 * - `unreadable`: the source object could not be read.
 * - `address-not-canonical`: the Media's stored address is still a provider
 *   address. Moving it would schedule the provider object for removal while
 *   published pages still link to it; the address sweep comes first.
 * - `checksum-mismatch`: the source bytes, or the copy read back from the
 *   target, do not match the checksum the record carries.
 * - `copy-failed`: the target could not store or reread the copied objects.
 * - `record-failed`: the copy exists, but the location record could not flip.
 */
export type RehomeFailureReason =
  | "source-unconfigured"
  | "unreadable"
  | "address-not-canonical"
  | "checksum-mismatch"
  | "copy-failed"
  | "record-failed";

export interface RehomeFailure {
  fileId: string;
  reason: RehomeFailureReason;
}

/**
 * The sentence the refusal, the confirmation and the library all show for a
 * volume that cannot hold the copies. One wording keeps the numbers the
 * server enforced identical to the numbers the admin was warned with.
 */
export function rehomeDiskShortageMessage(plan: RehomePlan): string {
  return `Not enough disk space: the move needs ${formatBytes(
    plan.bytes,
  )} of copies and only ${formatBytes(
    plan.availableBytes ?? 0,
  )} is free. Permanently delete files or free the disk before trying again.`;
}

/**
 * The space one move needs and whether it may start.
 *
 * The estimate includes the headroom. When the volume can hold the copies but
 * not the headroom the run is a `warning` and needs confirmation; when it
 * cannot hold even the copies it is `refused`. A file whose size the database
 * does not record makes the estimate incomplete, which is a warning too: the
 * move must not start on a number that cannot describe it. A provider target
 * has no local volume to exhaust, so it never warns.
 */
export function planRehome(input: {
  target: StorageDriverName;
  files: number;
  bytes: number;
  unknownFiles?: number;
  availableBytes: number | null;
  /** The active driver being reachable from this instance; defaults to yes. */
  targetConfigured?: boolean;
}): RehomePlan {
  const files = Number.isFinite(input.files)
    ? Math.max(0, Math.trunc(input.files))
    : 0;
  const bytes = Number.isFinite(input.bytes) ? Math.max(0, input.bytes) : 0;
  const unknownFiles = Math.min(
    files,
    Number.isFinite(input.unknownFiles ?? 0)
      ? Math.max(0, Math.trunc(input.unknownFiles ?? 0))
      : 0,
  );
  const requiredBytes = Math.ceil(bytes * (1 + REHOME_HEADROOM_RATIO));
  const targetConfigured = input.targetConfigured ?? true;

  const plan: RehomePlan = {
    target: input.target,
    files,
    bytes,
    requiredBytes,
    unknownFiles,
    availableBytes: input.availableBytes,
    level: "ok",
    blockedReason: null,
  };

  if (!targetConfigured) {
    return {
      ...plan,
      level: "refused",
      blockedReason: "target-unconfigured",
    };
  }

  if (bytes === 0 && unknownFiles === 0) return plan;
  if (input.availableBytes === null) return plan;

  if (input.availableBytes < bytes) {
    return { ...plan, level: "refused", blockedReason: "disk" };
  }

  if (
    unknownFiles > 0 ||
    input.availableBytes < requiredBytes
  ) {
    return { ...plan, level: "warning" };
  }

  return plan;
}
