import "server-only";

import { StoredFileOrigin, type Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { formatBytes } from "@/lib/format";

import {
  MEDIA_QUOTA_DEFAULT_MB,
  PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
  fitsMediaQuota,
  fitsPublicOriginReserve,
  mediaQuotaStatus,
  mediaTypeUsage,
  mediaUsageBytes,
  megabytesToBytes,
  type MediaQuotaStatus,
  type MediaQuotaUsageRow,
  type MediaStorageSnapshot,
  type MediaTypeUsage,
} from "@/modules/media/lib/quota";

/**
 * One advisory-lock key, so two uploads cannot both pass the "before the row
 * is created" check when the library has room for only one of them. Every
 * transport — library, attachment, avatar and public form — takes the same
 * lock, which is what lets the reserve protect an internal upload started at
 * the same moment as a public one.
 */
const STORAGE_QUOTA_LOCK_KEY = 0x4d454449; // "MEDI"

const usageFileSelect = {
  mediaId: true,
  size: true,
  origin: true,
  media: { select: { type: true, renditions: true } },
} satisfies Prisma.StoredFileSelect;

type UsageFileRow = Prisma.StoredFileGetPayload<{
  select: typeof usageFileSelect;
}>;

/**
 * The bytes one stored file occupies: its own size plus the renditions its
 * Media role accounts for. An attachment or avatar has no renditions and
 * contributes only its own size.
 */
function fileUsageRow(file: UsageFileRow): MediaQuotaUsageRow {
  return { size: file.size, renditions: file.media?.renditions ?? null };
}

export class MediaQuotaExceededError extends Error {
  readonly code = "MEDIA_QUOTA_EXCEEDED";

  constructor(
    readonly usedBytes: number,
    readonly totalBytes: number,
    readonly quotaMb: number,
  ) {
    super(
      `Storage uses ${formatBytes(usedBytes)} of its ${formatBytes(
        totalBytes,
      )} quota, so this upload would exceed it. Delete files permanently or raise the quota in Settings.`,
    );
    this.name = "MediaQuotaExceededError";
  }
}

/**
 * A public-origin upload that would take visitors past their reserve. It is a
 * separate, machine-readable refusal because the owner's own uploads are not
 * affected: the total quota still has room, the reserve does not.
 */
export class PublicOriginReserveExceededError extends Error {
  readonly code = "PUBLIC_ORIGIN_RESERVE_EXCEEDED";

  constructor(
    readonly publicBytes: number,
    readonly reserveBytes: number,
    readonly reserveMb: number,
  ) {
    super(
      `Public uploads use ${formatBytes(publicBytes)} of their ${formatBytes(
        reserveBytes,
      )} reserve, so this upload would exceed it. The owner's uploads are unaffected.`,
    );
    this.name = "PublicOriginReserveExceededError";
  }
}

interface StorageUsageSnapshot {
  usedBytes: number;
  publicBytes: number;
  quotaMb: number;
  reserveMb: number;
  /** Stored originals grouped by Media type; empty unless asked for. */
  byMediaType: MediaTypeUsage[];
}

interface UsageReadOptions {
  /** A Media being replaced no longer counts against itself. */
  excludeMediaId?: string;
  /** The widget reads the breakdown; the admission checks only need totals. */
  withMediaTypes?: boolean;
}

/**
 * Reads the quota, the reserve and the bytes every stored file occupies in one
 * round trip. Every file has a record, so the budget describes the disk without
 * a per-Media fallback. The per-type breakdown is opt-in, because admission
 * needs only the totals on the upload path.
 */
async function readUsage(
  client: Prisma.TransactionClient,
  { excludeMediaId, withMediaTypes = false }: UsageReadOptions = {},
): Promise<StorageUsageSnapshot> {
  const [settings, files] = await Promise.all([
    client.settings.findFirst({
      select: { mediaQuotaMb: true, publicOriginReserveMb: true },
    }),
    client.storedFile.findMany({ select: usageFileSelect }),
  ]);

  const countedFiles = excludeMediaId
    ? files.filter((file) => file.mediaId !== excludeMediaId)
    : files;

  return {
    usedBytes: mediaUsageBytes(countedFiles.map(fileUsageRow)),
    publicBytes: mediaUsageBytes(
      countedFiles
        .filter((file) => file.origin === StoredFileOrigin.PUBLIC)
        .map(fileUsageRow),
    ),
    quotaMb: settings?.mediaQuotaMb ?? MEDIA_QUOTA_DEFAULT_MB,
    reserveMb:
      settings?.publicOriginReserveMb ?? PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
    // Attachments and avatars have no Media type, so they count against the
    // total but no row; renditions share their Media's original and are not
    // independent files.
    byMediaType: withMediaTypes
      ? mediaTypeUsage(
          countedFiles.map((file) => ({
            type: file.media?.type ?? null,
            size: file.size,
          })),
        )
      : [],
  };
}

function assertQuotaFits(
  usage: StorageUsageSnapshot,
  incomingBytes: number,
  origin: StoredFileOrigin,
): void {
  if (!fitsMediaQuota(usage.usedBytes, incomingBytes, usage.quotaMb)) {
    throw new MediaQuotaExceededError(
      usage.usedBytes,
      megabytesToBytes(usage.quotaMb),
      usage.quotaMb,
    );
  }

  // The reserve bounds visitors only: the owner may always use the whole quota.
  if (
    origin === StoredFileOrigin.PUBLIC &&
    !fitsPublicOriginReserve(
      usage.publicBytes,
      incomingBytes,
      usage.reserveMb,
    )
  ) {
    throw new PublicOriginReserveExceededError(
      usage.publicBytes,
      megabytesToBytes(usage.reserveMb),
      usage.reserveMb,
    );
  }
}

export async function getMediaUsageBytes(): Promise<number> {
  return (await readUsage(db)).usedBytes;
}

/**
 * Everything the storage-details widget shows: the quota figure the uploads
 * enforce, plus the same read grouped by Media type. One read answers both, so
 * the progress bar and the breakdown can never describe different libraries.
 */
export async function getMediaStorageDetails(): Promise<MediaStorageSnapshot> {
  const { usedBytes, publicBytes, quotaMb, reserveMb, byMediaType } =
    await readUsage(db, { withMediaTypes: true });

  return {
    quota: mediaQuotaStatus(usedBytes, quotaMb, publicBytes, reserveMb),
    byMediaType,
  };
}

export async function getMediaQuotaStatus(): Promise<MediaQuotaStatus> {
  const { usedBytes, publicBytes, quotaMb, reserveMb } = await readUsage(db);

  return mediaQuotaStatus(usedBytes, quotaMb, publicBytes, reserveMb);
}

export interface StorageQuotaAdmission {
  /** Bytes this write will add. */
  incomingBytes: number;
  /** Who may create the file; public uploads are also bounded by the reserve. */
  origin?: StoredFileOrigin;
  /** A Media being replaced no longer counts against itself. */
  excludeMediaId?: string;
}

/**
 * The pre-write check for an owned file or a library upload. A public upload
 * decides here whether it may even reach the driver, so a refusal writes
 * neither bytes nor a row. The exact total is checked again under the lock
 * before the record is created.
 */
export async function assertStorageQuotaAllows({
  incomingBytes,
  origin = StoredFileOrigin.INTERNAL,
}: StorageQuotaAdmission): Promise<void> {
  const usage = await readUsage(db);

  assertQuotaFits(usage, incomingBytes, origin);
}

/**
 * Runs a write inside a transaction that re-reads usage and admits it only if
 * it still fits. The advisory lock serialises concurrent admissions, so an
 * upload started a moment earlier is seen by the next one.
 */
export async function withStorageQuotaAdmission<T>(
  {
    incomingBytes,
    origin = StoredFileOrigin.INTERNAL,
    excludeMediaId,
  }: StorageQuotaAdmission,
  write: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${STORAGE_QUOTA_LOCK_KEY})`;

    const usage = await readUsage(tx, { excludeMediaId });
    assertQuotaFits(usage, incomingBytes, origin);

    return write(tx);
  });
}

export interface MediaQuotaAdmission {
  /** Bytes this write will add: the original plus every rendition. */
  incomingBytes: number;
  /** A Media being replaced no longer counts against itself. */
  excludeMediaId?: string;
}

/**
 * The library's admission: a Media is always internal, so the reserve does not
 * apply to it.
 */
export async function withMediaQuotaAdmission<T>(
  { incomingBytes, excludeMediaId }: MediaQuotaAdmission,
  write: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return withStorageQuotaAdmission({ incomingBytes, excludeMediaId }, write);
}
