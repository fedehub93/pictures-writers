import "server-only";

import { statfs } from "node:fs/promises";
import path from "node:path";

import type { Prisma } from "@/generated/prisma";
import { formatBytes } from "@/lib/format";
import { db } from "@/shared/lib/db";

import { storedFileAddress } from "@/modules/media/lib/file-path";
import {
  buildMediaDeliveryUrl,
  decodeMediaManifest,
  MEDIA_MANIFEST_PARAM,
  stripMediaManifest,
} from "@/modules/media/lib/manifest";
import { mediaUsageBytes } from "@/modules/media/lib/quota";
import { mediaRenditionLocations } from "@/modules/media/lib/renditions";
import {
  planRehome,
  rehomeDiskShortageMessage,
  type PendingRehome,
  type RehomeFailure,
  type RehomeFailureReason,
  type RehomePlan,
} from "@/modules/media/lib/rehome";
import { mediaPath, parseSrc } from "@/modules/media/lib/url";
import type { MediaRenditionFormat } from "@/modules/media/types";

import { checksumOf } from "./image-bytes";
import {
  getActiveStorageDriverName,
  getLocalStorageRoot,
  isStorageDriverConfigured,
  resolveActiveStorageDriver,
  resolveMediaDriverName,
  resolveMediaStorageDriver,
  type ResolvedStorageDriver,
  type StorageDriver,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";

const DEFAULT_CONTENT_TYPE = "application/octet-stream";

/**
 * A disk preflight that cannot start must not even copy a byte. These errors
 * carry the plan so the interface can explain the refusal with the same
 * numbers it rendered.
 */
export class RehomeTargetUnconfiguredError extends Error {
  readonly code = "REHOME_TARGET_UNCONFIGURED";

  constructor(readonly plan: RehomePlan) {
    super(
      `The active storage driver "${plan.target}" is not configured on this instance, so files cannot be moved there.`,
    );
    this.name = "RehomeTargetUnconfiguredError";
  }
}

export class RehomeDiskSpaceError extends Error {
  readonly code = "REHOME_DISK_SPACE";

  constructor(readonly plan: RehomePlan) {
    super(rehomeDiskShortageMessage(plan));
    this.name = "RehomeDiskSpaceError";
  }
}

export class RehomeConfirmationRequiredError extends Error {
  readonly code = "REHOME_CONFIRMATION_REQUIRED";

  constructor(readonly plan: RehomePlan) {
    super(
      `The move reserves ${formatBytes(plan.requiredBytes)} with headroom and only ${formatBytes(plan.availableBytes ?? 0)} are free. Confirm the move to continue.`,
    );
    this.name = "RehomeConfirmationRequiredError";
  }
}

/**
 * The one preflight rule: a provider target is always allowed, an
 * unconfigured target never is, and a local target needs enough volume.
 */
export function assertRehomePlanAllows(
  plan: RehomePlan,
  confirmed: boolean,
): void {
  if (plan.blockedReason === "target-unconfigured") {
    throw new RehomeTargetUnconfiguredError(plan);
  }

  if (plan.level === "refused") {
    throw new RehomeDiskSpaceError(plan);
  }

  if (plan.level === "warning" && !confirmed) {
    throw new RehomeConfirmationRequiredError(plan);
  }
}

const pendingFileSelect = {
  size: true,
  media: { select: { renditions: true } },
} satisfies Prisma.StoredFileSelect;

/**
 * How many stored files still sit on a driver other than `target`, and how
 * many bytes moving them copies. A Media contributes its original's size plus
 * its rendition manifest; an attachment or avatar its own size. This is the
 * same accounting the quota uses. A file whose original records no size is
 * counted too, because the estimate cannot see its bytes.
 */
export async function pendingRehome(
  target: StorageDriverName,
  options: { fileIds?: string[] } = {},
): Promise<PendingRehome> {
  const files = await db.storedFile.findMany({
    where: {
      driver: { not: target },
      ...(options.fileIds ? { id: { in: options.fileIds } } : {}),
    },
    select: pendingFileSelect,
  });

  return {
    files: files.length,
    bytes: mediaUsageBytes(
      files.map((file) => ({
        size: file.size,
        renditions: file.media?.renditions ?? null,
      })),
    ),
    unknownFiles: files.filter(
      (file) =>
        typeof file.size !== "number" ||
        !Number.isFinite(file.size) ||
        file.size <= 0,
    ).length,
  };
}

type AvailableDiskBytes =
  | number
  | (() => Promise<number | null>)
  | null
  | undefined;

async function freeBytesAt(root: string): Promise<number | null> {
  let candidate = path.resolve(root);

  for (;;) {
    try {
      const stats = await statfs(candidate);
      return Number(stats.bavail) * Number(stats.bsize);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") return null;

      // The volume root may not exist yet on a fresh Installation: the first
      // upload creates it. Walk up to the volume that will hold it.
      const parent = path.dirname(candidate);
      if (parent === candidate) return null;
      candidate = parent;
    }
  }
}

async function resolveAvailableBytes(
  free: AvailableDiskBytes,
  root: string,
): Promise<number | null> {
  if (typeof free === "number") return free;
  if (typeof free === "function") return free();
  if (free === null) return null;

  return freeBytesAt(root);
}

export interface RehomePlanOptions {
  target?: ResolvedStorageDriver;
  env?: StorageEnvironment;
  /** Test seam: the free bytes the preflight reads instead of the volume. */
  availableDiskBytes?: AvailableDiskBytes;
  /** Limit the plan to specific stored files. Used by tests and by retries. */
  fileIds?: string[];
}

/**
 * The space the next move needs, read from the database and the target volume.
 * It writes nothing, so the library can ask before the owner commits.
 */
export async function planRehomeRun({
  target,
  env = process.env,
  availableDiskBytes,
  fileIds,
}: RehomePlanOptions = {}): Promise<RehomePlan> {
  const active = target ?? (await resolveActiveStorageDriver(env));
  const pending = await pendingRehome(active.name, { fileIds });
  const configured = isStorageDriverConfigured(active.name, env);

  // Only a local target can run out of the Installation's own disk. A
  // provider has no volume here; an unknown volume is not "clearly
  // insufficient", so it never blocks on a number it could not read.
  const availableBytes =
    active.name === "local" && configured
      ? await resolveAvailableBytes(
          availableDiskBytes,
          getLocalStorageRoot(env),
        )
      : null;

  return planRehome({
    target: active.name,
    files: pending.files,
    bytes: pending.bytes,
    unknownFiles: pending.unknownFiles,
    availableBytes,
    targetConfigured: configured,
  });
}

export interface RehomeProgress {
  fileId: string;
  status: "moved" | "failed";
  /** Present when the file could not be moved. */
  reason?: RehomeFailureReason;
  /** Bytes copied for this file, including its renditions. */
  bytes: number;
}

export interface RehomeReport {
  target: StorageDriverName;
  /** Files whose record now names the target driver. */
  moved: number;
  /** Files left where they were, each with its reason. */
  failed: RehomeFailure[];
  /** Bytes copied, originals plus renditions. */
  bytesMoved: number;
  /** Provider objects the run journaled for a later purge. */
  abandoned: number;
  /** The active driver changed mid-run; the rest are left for the next run. */
  superseded: boolean;
  /** A stop was requested; the rest are left for the next run. */
  stopped: boolean;
}

export interface RehomeRunOptions extends RehomePlanOptions {
  /** The plan already computed for this target, so the run does not repeat it. */
  plan?: RehomePlan;
  /** A warning-level plan needs this before the run may start. */
  confirmed?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: RehomeProgress) => void;
  /**
   * Whether a newer driver choice superseded this run. Defaults to reading
   * the active driver setting, which is what makes the next run converge.
   */
  isSuperseded?: () => Promise<boolean>;
  /**
   * Test seam: real driver clients supplied to the job instead of the ones
   * built from the environment. The fake provider's client passes through
   * here unchanged; nothing about storage is mocked.
   */
  drivers?: Partial<Record<StorageDriverName, StorageDriver>>;
}

const jobFileSelect = {
  id: true,
  key: true,
  driver: true,
  contentType: true,
  size: true,
  checksum: true,
  media: {
    select: {
      id: true,
      url: true,
      revision: true,
      archivedAt: true,
      renditions: true,
    },
  },
} satisfies Prisma.StoredFileSelect;

type RehomeFile = Prisma.StoredFileGetPayload<{ select: typeof jobFileSelect }>;

function renditionContentType(format: MediaRenditionFormat): string {
  return format === "avif" ? "image/avif" : "image/webp";
}

function sameBytes(
  left: Uint8Array<ArrayBuffer>,
  right: Uint8Array<ArrayBuffer>,
): boolean {
  if (left.byteLength !== right.byteLength) return false;

  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }

  return true;
}

/**
 * Rewrites the rendition addresses inside a Media's delivery token after its
 * bytes moved. The original's address is preserved exactly: only the `?mt=`
 * token changes, and only when the Media has renditions. An entry the run
 * could not locate keeps the address it already carried.
 */
function deliveredUrlAfterMove(
  media: NonNullable<RehomeFile["media"]>,
  renditionUrls: Map<string, string>,
): string {
  const moved = mediaRenditionLocations(media.renditions);
  if (moved.length === 0) return media.url;

  const entries = moved.map((rendition) => ({
    width: rendition.width,
    format: rendition.format,
    url: renditionUrls.get(rendition.key) ?? mediaPath(rendition.key),
  }));

  for (const kept of
    decodeMediaManifest(
      parseSrc(media.url).url.searchParams.get(MEDIA_MANIFEST_PARAM),
    )?.renditions ?? []) {

    if (
      !entries.some(
        (entry) =>
          entry.width === kept.width && entry.format === kept.format,
      )
    ) {
      entries.push(kept);
    }
  }

  return buildMediaDeliveryUrl(stripMediaManifest(media.url), {
    revision: media.revision,
    archived: media.archivedAt !== null,
    renditions: entries,
  });
}

async function discardCopiedObjects(
  driver: StorageDriver,
  keys: string[],
  fileId: string,
): Promise<void> {
  for (const key of keys) {
    try {
      await driver.delete(key);
    } catch {
      // The record still points at the source, so an unremoved copy is only
      // an object the audit reports; the address is already safe.
      console.error("[MEDIA_REHOME] could not remove a copied object", {
        fileId,
      });
    }
  }
}

interface MovedFile {
  ok: true;
  bytes: number;
  abandoned: number;
}

interface FailedFile {
  ok: false;
  reason: RehomeFailureReason;
}

/**
 * Moves one stored file, and its renditions when it is a Media, to the
 * target driver.
 *
 * The bytes are copied first and verified against the checksum the record
 * carries. Only then, inside one transaction, does the record change driver
 * and remote address and the Media's rendition token learn the new
 * addresses. The key, the revision and the original's canonical address never
 * change. A provider object left behind is journaled for the purge; a local
 * copy is removed once the record no longer points at it.
 */
async function moveStoredFile({
  file,
  active,
  env,
  drivers,
  supplied,
}: {
  file: RehomeFile;
  active: ResolvedStorageDriver;
  env: StorageEnvironment;
  drivers: Map<StorageDriverName, StorageDriver>;
  supplied?: Partial<Record<StorageDriverName, StorageDriver>>;
}): Promise<MovedFile | FailedFile> {
  const nameResolution = resolveMediaDriverName(file.driver, env);
  if (!nameResolution.resolved) {
    return { ok: false, reason: "source-unconfigured" };
  }

  const suppliedSource = supplied?.[nameResolution.name];

  let source: StorageDriver;
  if (suppliedSource) {
    source = suppliedSource;
  } else {
    const resolvedSource = resolveMediaStorageDriver(file.driver, {
      active,
      env,
      cache: drivers,
    });

    if (!resolvedSource.resolved) {
      return { ok: false, reason: "source-unconfigured" };
    }

    source = resolvedSource.driver;
  }

  if (file.key.length === 0) return { ok: false, reason: "unreadable" };

  // A Media addressed by a provider URL is one the address sweep has not
  // rewritten yet. Moving it would journal the provider object for removal
  // while published pages still link to it, so the sweep has to come first.
  if (file.media) {
    const address = storedFileAddress(file.media.url);
    if (address?.area !== "media" || address.key !== file.key) {
      return { ok: false, reason: "address-not-canonical" };
    }
  }

  let original: Uint8Array<ArrayBuffer>;
  try {
    original = await source.get(file.key);
  } catch {
    return { ok: false, reason: "unreadable" };
  }

  const checksum = checksumOf(original);
  if (file.checksum !== null && file.checksum !== checksum) {
    return { ok: false, reason: "checksum-mismatch" };
  }

  const renditions = mediaRenditionLocations(file.media?.renditions ?? null);
  const renditionBytes: Uint8Array<ArrayBuffer>[] = [];

  for (const rendition of renditions) {
    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = await source.get(rendition.key);
    } catch {
      return { ok: false, reason: "unreadable" };
    }

    if (
      typeof rendition.bytes === "number" &&
      rendition.bytes > 0 &&
      bytes.byteLength !== rendition.bytes
    ) {
      return { ok: false, reason: "checksum-mismatch" };
    }

    renditionBytes.push(bytes);
  }

  const copied: string[] = [];

  try {
    await active.driver.put(
      file.key,
      original,
      file.contentType ?? DEFAULT_CONTENT_TYPE,
    );
    copied.push(file.key);

    for (const [index, rendition] of renditions.entries()) {
      await active.driver.put(
        rendition.key,
        renditionBytes[index]!,
        renditionContentType(rendition.format),
      );
      copied.push(rendition.key);
    }
  } catch {
    await discardCopiedObjects(active.driver, copied, file.id);
    return { ok: false, reason: "copy-failed" };
  }

  // Read the copy back and prove it is the source's bytes. The recorded
  // checksum proves the source; the read-back proves the target, which is the
  // half a write-only job could never vouch for.
  try {
    const readBack = await active.driver.get(file.key);
    if (checksumOf(readBack) !== checksum) {
      await discardCopiedObjects(active.driver, copied, file.id);
      return { ok: false, reason: "checksum-mismatch" };
    }

    for (const [index, rendition] of renditions.entries()) {
      const readBack = await active.driver.get(rendition.key);
      if (!sameBytes(readBack, renditionBytes[index]!)) {
        await discardCopiedObjects(active.driver, copied, file.id);
        return { ok: false, reason: "checksum-mismatch" };
      }
    }
  } catch {
    await discardCopiedObjects(active.driver, copied, file.id);
    return { ok: false, reason: "copy-failed" };
  }

  let remoteUrl: string | null;
  const renditionUrls = new Map<string, string>();

  try {
    if (active.name === "local") {
      remoteUrl = null;
      for (const rendition of renditions) {
        renditionUrls.set(rendition.key, mediaPath(rendition.key));
      }
    } else {
      remoteUrl = await active.driver.url(file.key);
      for (const rendition of renditions) {
        renditionUrls.set(
          rendition.key,
          await active.driver.url(rendition.key),
        );
      }
    }
  } catch {
    await discardCopiedObjects(active.driver, copied, file.id);
    return { ok: false, reason: "copy-failed" };
  }

  const mediaUrl = file.media
    ? deliveredUrlAfterMove(file.media, renditionUrls)
    : null;

  // A local source is removed once the record no longer points at it; a
  // provider object must survive the redirect hop's cache and the grace
  // window, so it goes to the journal instead.
  const abandonedObjects =
    nameResolution.name === "local"
      ? []
      : [
          {
            driver: nameResolution.name,
            key: file.key,
            size: file.size ?? original.byteLength,
          },
          ...renditions.map((rendition, index) => ({
            driver: nameResolution.name,
            key: rendition.key,
            size: rendition.bytes || renditionBytes[index]!.byteLength,
          })),
        ];

  try {
    await db.$transaction(async (tx) => {
      await tx.storedFile.update({
        where: { id: file.id },
        data: {
          driver: active.name,
          remoteUrl,
          checksum: file.checksum ?? checksum,
        },
      });

      if (file.media) {
        await tx.media.update({
          where: { id: file.media.id },
          data: {
            storageDriver: active.name,
            ...(mediaUrl && mediaUrl !== file.media.url
              ? { url: mediaUrl }
              : {}),
          },
        });
      }

      if (active.name !== "local" && copied.length > 0) {
        // The key is live on the target again: a journal entry naming it would
        // let the purge delete bytes the library now serves.
        await tx.storagePurgeEntry.deleteMany({
          where: { driver: active.name, key: { in: copied } },
        });
      }

      if (abandonedObjects.length > 0) {
        for (const object of abandonedObjects) {
          // A key abandoned twice must take the newer stamp, or the purge's
          // grace window would start at the first move and expire early.
          await tx.storagePurgeEntry.upsert({
            where: {
              driver_key: { driver: object.driver, key: object.key },
            },
            create: object,
            update: { size: object.size, createdAt: new Date() },
          });
        }
      }
    });
  } catch {
    await discardCopiedObjects(active.driver, copied, file.id);
    return { ok: false, reason: "record-failed" };
  }

  if (nameResolution.name === "local") {
    for (const key of copied) {
      try {
        await source.delete(key);
      } catch {
        console.error("[MEDIA_REHOME] could not remove the local copy", {
          fileId: file.id,
        });
      }
    }
  }

  const copiedBytes =
    original.byteLength +
    renditionBytes.reduce((total, bytes) => total + bytes.byteLength, 0);

  return {
    ok: true,
    bytes: copiedBytes,
    abandoned: abandonedObjects.length,
  };
}

/**
 * Moves every stored file that does not sit on the target driver, one file at
 * a time, and leaves each file serving throughout: the record flips only
 * after the copy exists and its checksum is verified.
 *
 * The goal is recomputed from the database at every start, so an interrupted
 * run resumes with the files it already moved and a newer driver choice
 * supersedes the rest. A file that cannot be read is reported by id and keeps
 * serving from the driver that holds it. Nothing on a failure path changes an
 * address.
 */
export async function rehomeStoredFiles({
  target,
  env = process.env,
  plan,
  confirmed = false,
  signal,
  onProgress,
  isSuperseded,
  drivers: supplied,
  availableDiskBytes,
  fileIds,
}: RehomeRunOptions = {}): Promise<RehomeReport> {
  const active = target ?? (await resolveActiveStorageDriver(env));
  const resolvedPlan =
    plan ??
    (await planRehomeRun({
      target: active,
      env,
      availableDiskBytes,
      fileIds,
    }));

  assertRehomePlanAllows(resolvedPlan, confirmed);

  const supersededCheck =
    isSuperseded ??
    (async () => (await getActiveStorageDriverName(env)) !== active.name);

  const files = await db.storedFile.findMany({
    where: {
      driver: { not: active.name },
      ...(fileIds ? { id: { in: fileIds } } : {}),
    },
    select: jobFileSelect,
    // A deterministic order makes a stop or a supersede leave a stable
    // remainder for the next run.
    orderBy: { id: "asc" },
  });

  const drivers = new Map<StorageDriverName, StorageDriver>([
    [active.name, active.driver],
  ]);

  const report: RehomeReport = {
    target: active.name,
    moved: 0,
    failed: [],
    bytesMoved: 0,
    abandoned: 0,
    superseded: false,
    stopped: false,
  };

  for (const file of files) {
    if (signal?.aborted) {
      report.stopped = true;
      break;
    }

    if (await supersededCheck()) {
      report.superseded = true;
      break;
    }

    const outcome = await moveStoredFile({
      file,
      active,
      env,
      drivers,
      supplied,
    });

    if (outcome.ok) {
      report.moved += 1;
      report.bytesMoved += outcome.bytes;
      report.abandoned += outcome.abandoned;
      onProgress?.({
        fileId: file.id,
        status: "moved",
        bytes: outcome.bytes,
      });
      continue;
    }

    report.failed.push({ fileId: file.id, reason: outcome.reason });
    onProgress?.({
      fileId: file.id,
      status: "failed",
      reason: outcome.reason,
      bytes: 0,
    });
  }

  return report;
}
