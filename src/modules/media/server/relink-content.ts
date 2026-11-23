import "server-only";

import type { Prisma } from "@/generated/prisma";
import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  canonicalMediaAddress,
  type StoredAddressTarget,
} from "@/modules/media/lib/address-rewrite";
import { storedFilePath } from "@/modules/media/lib/file-path";
import {
  LEGACY_ASSET_PREFIX,
  UPLOADTHING_FILE_PATH,
} from "@/modules/media/lib/image-ladder.mjs";
import { classifyMediaType } from "@/modules/media/lib/media-type";
import {
  isUploadThingUrl,
  parseSrc,
  storageKeyFromMediaUrl,
} from "@/modules/media/lib/url";

import {
  ADDRESS_SWEEP_FIELDS,
  sweepStorageAddresses,
  type AddressSweepField,
  type AddressSweepReport,
} from "./address-sweep";
import { checksumOf } from "./image-bytes";
import { inspectImage } from "./inspect-image";
import {
  perceptualDistance as distanceBetweenHashes,
  perceptualHashOf,
  PERCEPTUAL_MATCH_DISTANCE,
} from "./perceptual-hash";
import {
  driverForStorageDriver,
  resolveMediaDriverName,
  type StorageDriver,
  type StorageDriverName,
  type StorageEnvironment,
} from "./storage";
import { createStoredFileForMedia } from "./stored-file";

/**
 * What happened to every address the sweep could not resolve. The groups are
 * the contract: an address the run did not relink to an existing Media must be
 * adopted, and everything else is named as unreachable so the operator can
 * decide about it.
 */
export type RelinkAddressGroup = "relinked" | "adopted" | "unreachable";

export interface RelinkFieldReport {
  field: AddressSweepField;
  /** Occurrences of unresolved addresses in this field. */
  occurrences: number;
  relinked: number;
  adopted: number;
  unreachable: number;
  /** Occurrences whose bytes matched more than one library file. */
  ambiguous: number;
}

export interface RelinkReport {
  dryRun: boolean;
  /** Distinct addresses the sweep could not resolve. */
  addresses: number;
  /** Addresses relinked to the Media that already owned their bytes. */
  relinked: number;
  /** Addresses that became a new Media and Stored file, with no byte moved. */
  adopted: number;
  /** Addresses whose bytes could not be fetched or attributed. */
  unreachable: number;
  /** Addresses whose bytes matched more than one library file. */
  ambiguous: number;
  /** Addresses relinked by a perceptual match rather than an exact checksum. */
  perceptual: number;
  /**
   * Addresses the run tried to adopt and could not write. They are counted as
   * unreachable too, because content still names an object the library lacks.
   */
  failed: number;
  /** The sweep with this run's decisions applied: its residual is the remainder. */
  sweep: AddressSweepReport;
  fields: RelinkFieldReport[];
}

export interface RelinkOptions {
  dryRun?: boolean;
  env?: StorageEnvironment;
  /**
   * Test seam: driver clients supplied to the job instead of the ones built
   * from the environment. The fake provider's client passes through here
   * unchanged; nothing about storage is mocked.
   */
  drivers?: Partial<Record<StorageDriverName, StorageDriver>>;
  /** Test seam: the HTTP client an object is fetched with. */
  fetchImpl?: typeof fetch;
  /** A perceptual distance that still counts as one picture. */
  perceptualDistance?: number;
  onProgress?: (line: string) => void;
}

/**
 * The bytes of one object, or `null` when the address does not serve them. A
 * transport failure or a timeout is retried: the run is a one-off over a few
 * hundred objects, and one slow response must not strand an address.
 */
async function fetchObjectBytes(
  address: string,
  fetchImpl: typeof fetch,
): Promise<Uint8Array<ArrayBuffer> | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(address, {
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) return null;

      return new Uint8Array(await response.arrayBuffer());
    } catch {
      // Try again; a 404 or a 403 is not retried because it is an answer.
    }
  }

  return null;
}

/**
 * The provider origins the library's own remote files were written with. A
 * retired host still answers for most objects, but an object that migrated to
 * the current host answers only there; this is where that host comes from, so
 * no provider app id is hard-coded.
 */
function providerOrigins(files: readonly LibraryFile[]): string[] {
  const counts = new Map<string, number>();

  for (const file of files) {
    if (!file.remoteUrl) continue;

    const { url, absolute } = parseSrc(file.remoteUrl);
    if (!absolute || !isUploadThingUrl(url)) continue;

    counts.set(url.origin, (counts.get(url.origin) ?? 0) + 1);
  }

  return [...counts]
    .sort(
      ([leftOrigin, left], [rightOrigin, right]) =>
        right - left || leftOrigin.localeCompare(rightOrigin),
    )
    .map(([origin]) => origin);
}

/**
 * Reads one content object. The address content names is tried first, then the
 * same provider key on every origin the library still serves from — the
 * retired host and the current one need no App Router rewrite here. The
 * address that answered is returned so an adoption records a live one.
 */
async function readProviderObject(
  address: string,
  origins: readonly string[],
  fetchImpl: typeof fetch,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; address: string } | null> {
  const key = providerKeyForAddress(address);
  if (!key) return null;

  const { absolute } = parseSrc(address);
  const path = `${UPLOADTHING_FILE_PATH}${encodeURIComponent(key)}`;
  const candidates = new Set<string>();

  if (absolute) candidates.add(address);
  for (const origin of origins) candidates.add(`${origin}${path}`);

  for (const candidate of candidates) {
    const bytes = await fetchObjectBytes(candidate, fetchImpl);
    if (bytes) return { bytes, address: candidate };
  }

  return null;
}

const libraryFileSelect = {
  id: true,
  key: true,
  driver: true,
  remoteUrl: true,
  checksum: true,
  size: true,
  contentType: true,
  media: {
    select: {
      id: true,
      type: true,
      revision: true,
      archivedAt: true,
      createdAt: true,
      renditions: true,
    },
  },
} satisfies Prisma.StoredFileSelect;

type LibraryFile = Prisma.StoredFileGetPayload<{
  select: typeof libraryFileSelect;
}>;

type LibraryMedia = NonNullable<LibraryFile["media"]>;

/**
 * An object this run will adopt, identified before its rows exist so a second
 * address naming the same bytes can point at it instead of adopting a copy.
 */
interface PendingAdoption {
  key: string;
  canonicalAddress: string;
}

type Decision =
  | {
      kind: "relink";
      target: StoredAddressTarget;
      /** Set when the target is a PendingAdoption rather than a stored file. */
      pendingTargetAddress?: string;
    }
  | {
      kind: "adopt";
      key: string;
      /** The live provider address: the record's remote location. */
      providerAddress: string;
      /** The canonical address content becomes. */
      canonicalAddress: string;
      /** A run-local number that gives the new Media a human name. */
      ordinal: number;
      bytes: Uint8Array<ArrayBuffer>;
      checksum: string;
    }
  | { kind: "unreachable" };

function mediaOf(file: LibraryFile): LibraryMedia {
  if (!file.media) {
    throw new Error("A library file without its Media role reached the relink.");
  }

  return file.media;
}

/**
 * The Media the content should name, when several library files own the same
 * bytes. A visible Media wins over an archived one, then the oldest, then the
 * lowest id, so a second run of the same data reaches the same row.
 */
function compareLibraryFiles(left: LibraryFile, right: LibraryFile): number {
  const leftMedia = mediaOf(left);
  const rightMedia = mediaOf(right);

  const leftArchived = leftMedia.archivedAt === null ? 0 : 1;
  const rightArchived = rightMedia.archivedAt === null ? 0 : 1;
  if (leftArchived !== rightArchived) return leftArchived - rightArchived;

  const created =
    leftMedia.createdAt.getTime() - rightMedia.createdAt.getTime();
  if (created !== 0) return created;

  return (
    leftMedia.id.localeCompare(rightMedia.id) || left.id.localeCompare(right.id)
  );
}

function targetFor(file: LibraryFile): StoredAddressTarget {
  const media = mediaOf(file);

  return {
    fileId: file.id,
    address: canonicalMediaAddress(file.key, {
      revision: media.revision,
      archived: media.archivedAt !== null,
      renditions: media.renditions,
    }),
  };
}

/**
 * The provider key behind a content address, or `null` when the address names
 * no provider object. A relative `/assets/<key>` is the legacy provider shape
 * the build rewrites before it reaches a browser; it names the same object.
 */
function providerKeyForAddress(address: string): string | null {
  const { url, absolute } = parseSrc(address);

  if (absolute) {
    if (!isUploadThingUrl(url)) return null;
  } else if (!url.pathname.startsWith(LEGACY_ASSET_PREFIX)) {
    return null;
  }

  return storageKeyFromMediaUrl(address);
}

/**
 * Every stored file that is a Media's location, with the role facts the
 * canonical address and the perceptual comparison need.
 */
async function readLibraryFiles(): Promise<LibraryFile[]> {
  const files = await db.storedFile.findMany({
    where: { mediaId: { not: null } },
    select: libraryFileSelect,
    orderBy: { id: "asc" },
  });

  return files.sort(compareLibraryFiles);
}

function groupOf(decision: Decision | undefined): RelinkAddressGroup {
  if (decision?.kind === "relink") return "relinked";
  if (decision?.kind === "adopt") return "adopted";
  return "unreachable";
}

interface HashCandidate<Value> {
  value: Value;
  hash: Uint8Array;
}

/**
 * The closest candidate within `maxDistance`, with `prefer` deciding a tie,
 * and how many candidates were within reach. Two pictures from different
 * sources can both be plausible, which is what the count is for.
 */
function nearest<Value>(
  hash: Uint8Array,
  candidates: readonly HashCandidate<Value>[],
  maxDistance: number,
  prefer?: (left: Value, right: Value) => number,
): { value: Value; distance: number; matches: number } | null {
  let match: { value: Value; distance: number } | null = null;
  let matches = 0;

  for (const candidate of candidates) {
    const distance = distanceBetweenHashes(hash, candidate.hash);
    if (distance > maxDistance) continue;

    matches += 1;
    if (
      !match ||
      distance < match.distance ||
      (distance === match.distance &&
        prefer &&
        prefer(candidate.value, match.value) < 0)
    ) {
      match = { value: candidate.value, distance };
    }
  }

  return match ? { ...match, matches } : null;
}

function groupCountsByField(
  unresolved: ReadonlyMap<string, ReadonlyMap<AddressSweepField, number>>,
  decisions: ReadonlyMap<string, Decision>,
  ambiguousAddresses: ReadonlySet<string>,
): RelinkFieldReport[] {
  const tallies = new Map<
    AddressSweepField,
    {
      occurrences: number;
      relinked: number;
      adopted: number;
      unreachable: number;
      ambiguous: number;
    }
  >(
    ADDRESS_SWEEP_FIELDS.map((field) => [
      field,
      { occurrences: 0, relinked: 0, adopted: 0, unreachable: 0, ambiguous: 0 },
    ]),
  );

  for (const [address, fields] of unresolved) {
    const group = groupOf(decisions.get(address));
    const ambiguous = ambiguousAddresses.has(address);

    for (const [field, count] of fields) {
      const tally = tallies.get(field)!;
      tally.occurrences += count;
      tally[group] += count;
      if (ambiguous) tally.ambiguous += count;
    }
  }

  return ADDRESS_SWEEP_FIELDS.map((field) => ({
    field,
    ...tallies.get(field)!,
  }));
}

/**
 * Turns the addresses live content still names but no Stored file records into
 * addresses the library can serve.
 *
 * The match is exact first: the bytes are fetched and their sha256 compared
 * with the checksum each Media's record carries. A single owner relinks the
 * content to that Media's canonical address and writes no row; several owners
 * resolve by a fixed rule and are reported. An object no checksum matches is
 * compared perceptually with every image the library holds before it is
 * adopted, so a re-encoded copy of a picture the library already has is
 * relinked instead of duplicated. Only an object that is genuinely new becomes
 * a Media and a Stored file — recording the provider address, still moving no
 * byte.
 *
 * The final write is a normal address sweep with the run's decisions supplied
 * as extra address targets, so the sweep's own contract (live content only,
 * idempotence, a dry run that writes nothing) still holds.
 */
export async function relinkMediaContent({
  dryRun = false,
  env = process.env,
  drivers: supplied,
  fetchImpl = fetch,
  perceptualDistance = PERCEPTUAL_MATCH_DISTANCE,
  onProgress,
}: RelinkOptions = {}): Promise<RelinkReport> {
  const clientCache = new Map<StorageDriverName, StorageDriver>();

  const driverFor = (name: StorageDriverName): StorageDriver => {
    const suppliedDriver = supplied?.[name];
    if (suppliedDriver) return suppliedDriver;

    const cached = clientCache.get(name);
    if (cached) return cached;

    const driver = driverForStorageDriver(name, env);
    clientCache.set(name, driver);
    return driver;
  };

  const unresolved = new Map<string, Map<AddressSweepField, number>>();

  await sweepStorageAddresses({
    dryRun: true,
    onUnresolvedAddress: (address, field) => {
      let fields = unresolved.get(address);
      if (!fields) {
        fields = new Map();
        unresolved.set(address, fields);
      }

      fields.set(field, (fields.get(field) ?? 0) + 1);
    },
  });

  const addresses = [...unresolved.keys()].sort();
  if (addresses.length === 0) onProgress?.("no unresolved addresses");

  const libraryFiles =
    addresses.length === 0 ? [] : await readLibraryFiles();
  const byChecksum = new Map<string, LibraryFile[]>();
  for (const file of libraryFiles) {
    if (!file.checksum) continue;

    const group = byChecksum.get(file.checksum);
    if (group) group.push(file);
    else byChecksum.set(file.checksum, [file]);
  }

  const origins = providerOrigins(libraryFiles);
  const imageFiles = libraryFiles.filter(
    (file) => mediaOf(file).type === MediaType.IMAGE,
  );
  const hashes = new Map<string, Uint8Array | null>();

  const hashOf = async (file: LibraryFile): Promise<Uint8Array | null> => {
    if (hashes.has(file.id)) return hashes.get(file.id)!;

    // The record's remote address is what delivery redirects to; the provider
    // API may no longer resolve a pre-seam key, so that address is read first.
    let bytes = file.remoteUrl
      ? ((await readProviderObject(file.remoteUrl, origins, fetchImpl))
          ?.bytes ?? null)
      : null;

    if (!bytes) {
      const resolution = resolveMediaDriverName(file.driver, env);

      if (resolution.resolved) {
        try {
          bytes = await driverFor(resolution.name).get(file.key);
        } catch {
          // An image this instance cannot read is not a match. The audit names
          // the file; the relink cannot compare bytes it never received.
          bytes = null;
        }
      }
    }

    const hash = bytes ? await perceptualHashOf(bytes) : null;

    hashes.set(file.id, hash);
    return hash;
  };

  const decisions = new Map<string, Decision>();
  const pendingByChecksum = new Map<string, PendingAdoption>();
  const pendingHashes: HashCandidate<PendingAdoption>[] = [];
  const ambiguousAddresses = new Set<string>();
  const perceptualAddresses = new Set<string>();
  let plannedAdoptions = 0;

  const pendingTargetOf = (pending: {
    key: string;
    canonicalAddress: string;
  }): StoredAddressTarget => ({
    fileId: `pending:${pending.key}`,
    address: pending.canonicalAddress,
  });

  /**
   * Points one address at an object this run will adopt. Two content addresses
   * for the same new picture therefore add one Media, not two.
   */
  const decidePendingRelink = (
    address: string,
    pending: PendingAdoption,
    perceptual: boolean,
  ): void => {
    decisions.set(address, {
      kind: "relink",
      target: pendingTargetOf(pending),
      pendingTargetAddress: pending.canonicalAddress,
    });

    if (perceptual) perceptualAddresses.add(address);
  };

  for (const [index, address] of addresses.entries()) {
    onProgress?.(`read ${index + 1}/${addresses.length}`);

    const key = providerKeyForAddress(address);
    if (!key) {
      decisions.set(address, { kind: "unreachable" });
      continue;
    }

    const object = await readProviderObject(address, origins, fetchImpl);
    if (!object) {
      decisions.set(address, { kind: "unreachable" });
      continue;
    }

    const bytes = object.bytes;
    const checksum = checksumOf(bytes);
    const exact = byChecksum.get(checksum);

    if (exact && exact.length > 0) {
      if (exact.length > 1) ambiguousAddresses.add(address);

      decisions.set(address, {
        kind: "relink",
        target: targetFor(exact[0]!),
      });
      continue;
    }

    // The same new object named by a second address is one adoption, not two.
    const planned = pendingByChecksum.get(checksum);
    if (planned) {
      decidePendingRelink(address, planned, false);
      continue;
    }

    const hash = await perceptualHashOf(bytes);

    if (hash !== null) {
      const pendingMatch = nearest(
        hash,
        pendingHashes,
        perceptualDistance,
      );

      if (pendingMatch) {
        decidePendingRelink(address, pendingMatch.value, true);
        continue;
      }

      const candidates: HashCandidate<LibraryFile>[] = [];

      for (const file of imageFiles) {
        const candidate = await hashOf(file);
        if (candidate !== null) candidates.push({ value: file, hash: candidate });
      }

      const match = nearest(
        hash,
        candidates,
        perceptualDistance,
        compareLibraryFiles,
      );

      if (match) {
        if (match.matches > 1) ambiguousAddresses.add(address);
        perceptualAddresses.add(address);

        decisions.set(address, {
          kind: "relink",
          target: targetFor(match.value),
        });
        continue;
      }
    }

    const pending: PendingAdoption = {
      key,
      canonicalAddress: storedFilePath("MEDIA", key),
    };

    pendingByChecksum.set(checksum, pending);
    if (hash !== null) pendingHashes.push({ value: pending, hash });

    plannedAdoptions += 1;

    decisions.set(address, {
      kind: "adopt",
      key,
      providerAddress: object.address,
      canonicalAddress: pending.canonicalAddress,
      ordinal: plannedAdoptions,
      bytes,
      checksum,
    });
  }

  const overrides = new Map<string, StoredAddressTarget>();
  const failedAdoptions = new Set<string>();
  let failed = 0;

  // Adopt first, so a relink to a planned adoption knows whether its target
  // exists before any address is rewritten.
  if (!dryRun) {
    for (const [address, decision] of decisions) {
      if (decision.kind !== "adopt") continue;

      try {
        overrides.set(address, await adoptObject(decision, env));
      } catch {
        failed += 1;
        failedAdoptions.add(decision.canonicalAddress);
        decisions.set(address, { kind: "unreachable" });
      }
    }
  }

  for (const [address, decision] of decisions) {
    if (decision.kind === "relink") {
      // Never point content at a Media whose adoption failed.
      if (
        decision.pendingTargetAddress &&
        failedAdoptions.has(decision.pendingTargetAddress)
      ) {
        decisions.set(address, { kind: "unreachable" });
        perceptualAddresses.delete(address);
        continue;
      }

      overrides.set(address, decision.target);
      continue;
    }

    if (decision.kind === "adopt" && dryRun) {
      overrides.set(address, pendingTargetOf(decision));
    }
  }

  onProgress?.("sweep");

  const sweep = await sweepStorageAddresses({
    dryRun,
    addressOverrides: overrides,
  });

  const fields = groupCountsByField(
    unresolved,
    decisions,
    ambiguousAddresses,
  );
  const counts: Record<RelinkAddressGroup, number> = {
    relinked: 0,
    adopted: 0,
    unreachable: 0,
  };

  for (const decision of decisions.values()) {
    counts[groupOf(decision)] += 1;
  }

  return {
    dryRun,
    addresses: addresses.length,
    ...counts,
    ambiguous: ambiguousAddresses.size,
    perceptual: perceptualAddresses.size,
    failed,
    sweep,
    fields,
  };
}

/**
 * Creates the Media and Stored file an object no library file matches needs.
 * The provider address becomes the record's remote location and its own key
 * stays the storage key, exactly like a pre-seam row, so the re-home can read
 * it through its recorded driver later. No byte is written or moved.
 */
async function adoptObject(
  decision: Extract<Decision, { kind: "adopt" }>,
  env: StorageEnvironment,
): Promise<StoredAddressTarget> {
  const inspected = await inspectImage(decision.bytes).catch(() => null);
  const contentType = inspected?.mimeType ?? "application/octet-stream";
  const type = classifyMediaType(contentType) ?? MediaType.FILE;
  const noun = type === MediaType.IMAGE ? "image" : "file";
  const name = `Adopted ${noun} ${decision.ordinal}`;

  // The bytes were read through this driver a moment ago; recording the row is
  // only meaningful if that driver is still reachable here.
  const resolution = resolveMediaDriverName("uploadthing", env);
  if (!resolution.resolved) {
    throw new Error(resolution.reason);
  }

  return db.$transaction(async (tx) => {
    const media = await tx.media.create({
      data: {
        name,
        type,
        revision: 1,
        metadata: inspected?.metadata ?? null,
      },
    });

    const file = await createStoredFileForMedia(tx, media.id, {
      key: decision.key,
      driver: resolution.name,
      remoteUrl: decision.providerAddress,
      contentType,
      size: decision.bytes.byteLength,
      checksum: decision.checksum,
    });

    return {
      fileId: file.id,
      address: canonicalMediaAddress(decision.key, {
        revision: media.revision,
        archived: false,
        renditions: null,
      }),
    };
  });
}

/**
 * The process exit code for a finished relink: an address left unresolved, or
 * an adoption that could not be written, still ties the site to an object the
 * library does not serve.
 */
export function relinkExitCode(
  report: Pick<RelinkReport, "unreachable" | "failed" | "sweep">,
): number {
  return report.unreachable > 0 ||
    report.failed > 0 ||
    report.sweep.unresolved > 0
    ? 1
    : 0;
}

/**
 * The operator-facing lines for one relink. Field names and counts only: an
 * address, a key or a provider host must never reach the deployment log.
 */
export function formatRelinkReport(report: RelinkReport): string[] {
  const lines = [
    `dry run: ${report.dryRun ? "yes" : "no"}`,
    `addresses: ${report.addresses}`,
    `relinked: ${report.relinked}`,
    `  by checksum: ${report.relinked - report.perceptual}`,
    `  by perceptual match: ${report.perceptual}`,
    `adopted: ${report.adopted}`,
    `ambiguous: ${report.ambiguous}`,
    `unreachable: ${report.unreachable}`,
    `failed: ${report.failed}`,
    `sweep addresses rewritten: ${report.sweep.rewritten}`,
    `sweep unresolved: ${report.sweep.unresolved}`,
  ];

  for (const entry of report.fields) {
    if (entry.occurrences === 0) continue;

    lines.push(
      `  ${entry.field} occurrences=${entry.occurrences} relinked=${entry.relinked} adopted=${entry.adopted} unreachable=${entry.unreachable} ambiguous=${entry.ambiguous}`,
    );
  }

  return lines;
}
