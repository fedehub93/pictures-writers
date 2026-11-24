import "server-only";

import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { forEachWithConcurrency } from "./bounded-concurrency";
import { checksumOf } from "./image-bytes";
import { readObject } from "./remote-object";
import { sniffContentType } from "./sniff-content-type";
import {
  recordedStorageDriverName,
  resolveMediaStorageDriver,
  type ResolvedStorageDriver,
  type StorageDriver,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";

export interface ChecksumRepairFailure {
  /** The stored file's id. Never its key or address. */
  fileId: string;
  /** The driver the record names, or `uploadthing` for a record that named none. */
  driver: string;
  reason: string;
}

export interface ChecksumRepairDriverReport {
  driver: string;
  scanned: number;
  updated: number;
  unchanged: number;
  failed: number;
}

export interface ChecksumRepairReport {
  /** Stored files examined: every role and every recorded driver. */
  scanned: number;
  /** Records whose checksum, size or content type disagreed with the bytes. */
  updated: number;
  /** Records the bytes already described: a second run reports all of them. */
  unchanged: number;
  failed: ChecksumRepairFailure[];
  /** The same counts per driver, so a mixed library reads as its parts. */
  drivers: ChecksumRepairDriverReport[];
  dryRun: boolean;
}

export interface ChecksumRepairOptions {
  /** The active driver, reused for rows recorded against it. */
  active: ResolvedStorageDriver;
  /** Resolves each row's recorded driver; defaults to the process env. */
  env?: StorageEnvironment;
  /** Limit the run to specific stored files. Used by tests and by retries. */
  fileIds?: string[];
  concurrency?: number;
  dryRun?: boolean;
  /** Test seam: the HTTP client a recorded address is read with. */
  fetchImpl?: typeof fetch;
  /**
   * Test seam: driver clients supplied to the run instead of the ones built
   * from the environment. The fake provider's client passes through here
   * unchanged; nothing about storage is mocked.
   */
  drivers?: Partial<Record<StorageDriverName, StorageDriver>>;
  onProgress?: (line: string) => void;
}

/**
 * Reading a few hundred objects is network-bound and light on CPU, so four at a
 * time already saturates a quiet installation without competing with Postgres.
 */
export const DEFAULT_CHECKSUM_REPAIR_CONCURRENCY = 4;

const repairFileSelect = {
  id: true,
  key: true,
  driver: true,
  remoteUrl: true,
  contentType: true,
  size: true,
  checksum: true,
} satisfies Prisma.StoredFileSelect;

type RepairFile = Prisma.StoredFileGetPayload<{
  select: typeof repairFileSelect;
}>;

interface ReadSuccess {
  ok: true;
  bytes: Uint8Array<ArrayBuffer>;
}

interface ReadFailure {
  ok: false;
  reason: string;
}

/**
 * The bytes one record owns, read the way delivery reaches them: the address
 * the record carries first, the recorded driver's `get` only as the fallback.
 *
 * A pre-seam key may no longer resolve through the provider's key API even
 * though its recorded address still serves the bytes, so the address is the
 * path that repairs the library rather than reporting most of it unreadable. A
 * local record is read from the volume: its address is not where its bytes are.
 */
async function readStoredBytes({
  file,
  active,
  env,
  drivers,
  fetchImpl,
}: {
  file: RepairFile;
  active: ResolvedStorageDriver;
  env: StorageEnvironment;
  drivers: Partial<Record<StorageDriverName, StorageDriver>> | undefined;
  fetchImpl: typeof fetch;
}): Promise<ReadSuccess | ReadFailure> {
  let failureReason = "unreadable";

  const bytes = await readObject({
    key: file.key,
    address: file.driver === "local" ? null : file.remoteUrl,
    fetchImpl,
    loadDriver: () => {
      const resolution = resolveMediaStorageDriver(file.driver, { active, env });

      if (!resolution.resolved) {
        failureReason = resolution.reason;
        return null;
      }

      return drivers?.[resolution.name] ?? resolution.driver;
    },
  });

  if (!bytes) return { ok: false, reason: failureReason };

  return { ok: true, bytes };
}

/**
 * Repairs `StoredFile.checksum` so it describes the bytes the record actually
 * owns.
 *
 * The rendition backfill used to record the checksum of the source it read while
 * writing a normalised copy, so most of a backfilled library carried a checksum
 * no verifier could match: the re-home refused the file and duplicate detection
 * missed it. This one-off run re-reads every stored file — its recorded address
 * first, because the provider key API may not resolve pre-seam keys, and its
 * recorded driver otherwise — and writes the sha256, byte length and content
 * type those bytes prove. A file whose bytes cannot be read is reported by id
 * and driver and left exactly as it was, so it keeps serving and a later run can
 * retry it. Local files are read from the volume, because the same backfill
 * could have written a local row from a different source.
 *
 * It is idempotent: a record already true is counted as unchanged and no row is
 * written. A dry run performs the reads and the whole comparison and writes
 * nothing.
 */
export async function repairMediaChecksums({
  active,
  env = process.env,
  fileIds,
  concurrency = DEFAULT_CHECKSUM_REPAIR_CONCURRENCY,
  dryRun = false,
  fetchImpl = fetch,
  drivers,
  onProgress,
}: ChecksumRepairOptions): Promise<ChecksumRepairReport> {
  const files = await db.storedFile.findMany({
    where: fileIds ? { id: { in: fileIds } } : undefined,
    select: repairFileSelect,
    orderBy: { id: "asc" },
  });

  const driverReports = new Map<string, ChecksumRepairDriverReport>();
  const report: ChecksumRepairReport = {
    scanned: files.length,
    updated: 0,
    unchanged: 0,
    failed: [],
    drivers: [],
    dryRun,
  };

  const reportFor = (driver: string): ChecksumRepairDriverReport => {
    const existing = driverReports.get(driver);
    if (existing) return existing;

    const created = {
      driver,
      scanned: 0,
      updated: 0,
      unchanged: 0,
      failed: 0,
    };
    driverReports.set(driver, created);
    return created;
  };

  await forEachWithConcurrency(files, concurrency, async (file) => {
    const driver = recordedStorageDriverName(file.driver);
    const tally = reportFor(driver);
    tally.scanned += 1;

    const read = await readStoredBytes({
      file,
      active,
      env,
      drivers,
      fetchImpl,
    });

    if (!read.ok) {
      report.failed.push({ fileId: file.id, driver, reason: read.reason });
      tally.failed += 1;
      onProgress?.(`fail ${file.id} (${driver}): ${read.reason}`);
      return;
    }

    const checksum = checksumOf(read.bytes);
    const size = read.bytes.byteLength;
    const contentType = sniffContentType(read.bytes) ?? file.contentType;

    const changed =
      checksum !== file.checksum ||
      size !== file.size ||
      contentType !== file.contentType;

    if (!changed) {
      report.unchanged += 1;
      tally.unchanged += 1;
      onProgress?.(`skip ${file.id} (${driver}): already describes its bytes`);
      return;
    }

    if (!dryRun) {
      await db.storedFile.update({
        where: { id: file.id },
        data: { checksum, size, contentType },
      });
    }

    report.updated += 1;
    tally.updated += 1;
    onProgress?.(
      `${dryRun ? "would update" : "update"} ${file.id} (${driver})`,
    );
  });

  report.drivers = [...driverReports.values()].sort((left, right) =>
    left.driver.localeCompare(right.driver),
  );

  return report;
}

/**
 * The process exit code for a finished checksum repair: a file whose bytes could
 * not be read is still unverified, so the command fails and a deployment gate
 * can rely on the status instead of parsing the report.
 */
export function checksumRepairExitCode(
  report: Pick<ChecksumRepairReport, "failed">,
): number {
  return report.failed.length > 0 ? 1 : 0;
}

/**
 * The operator-facing lines for one repair. File ids, drivers and aggregates
 * only: a key, an address or a provider host must never reach the deployment
 * log.
 */
export function formatChecksumRepairReport(
  report: ChecksumRepairReport,
): string[] {
  const lines = [
    `dry run: ${report.dryRun ? "yes" : "no"}`,
    `files: ${report.scanned}`,
    `updated: ${report.updated}`,
    `unchanged: ${report.unchanged}`,
    `failed: ${report.failed.length}`,
  ];

  for (const entry of report.drivers) {
    lines.push(
      `  ${entry.driver} scanned=${entry.scanned} updated=${entry.updated} unchanged=${entry.unchanged} failed=${entry.failed}`,
    );
  }

  for (const failure of report.failed) {
    lines.push(`  ${failure.fileId} ${failure.driver} ${failure.reason}`);
  }

  return lines;
}
