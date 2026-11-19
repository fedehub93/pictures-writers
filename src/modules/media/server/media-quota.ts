import "server-only";

import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { formatBytes } from "@/lib/format";

import {
  MEDIA_QUOTA_DEFAULT_MB,
  fitsMediaQuota,
  mediaQuotaStatus,
  mediaUsageBytes,
  megabytesToBytes,
  type MediaQuotaStatus,
  type MediaQuotaUsageRow,
} from "@/modules/media/lib/quota";

import { mediaStorageSize } from "./stored-file";

/**
 * One advisory-lock key, so two uploads cannot both pass the "before the row
 * is created" check when the library has room for only one of them.
 */
const MEDIA_QUOTA_LOCK_KEY = 0x4d454449; // "MEDI"

const mediaUsageSelect = {
  size: true,
  renditions: true,
  storedFile: { select: { size: true } },
} satisfies Prisma.MediaSelect;

type MediaUsageRow = Prisma.MediaGetPayload<{
  select: typeof mediaUsageSelect;
}>;

/**
 * The original's size comes from its stored-file record; the Media's own
 * column is read only until that record carries a size. Renditions stay on the
 * Media. The arithmetic itself is unchanged.
 */
function quotaUsageRow(row: MediaUsageRow): MediaQuotaUsageRow {
  return {
    size: mediaStorageSize(row, row.storedFile),
    renditions: row.renditions,
  };
}

export class MediaQuotaExceededError extends Error {
  readonly code = "MEDIA_QUOTA_EXCEEDED";

  constructor(
    readonly usedBytes: number,
    readonly totalBytes: number,
    readonly quotaMb: number,
  ) {
    super(
      `The media library uses ${formatBytes(usedBytes)} of its ${formatBytes(
        totalBytes,
      )} quota, so this upload would exceed it. Delete media permanently or raise the quota in Settings.`,
    );
    this.name = "MediaQuotaExceededError";
  }
}

interface MediaUsageSnapshot {
  usedBytes: number;
  quotaMb: number;
}

/** Reads the quota and the bytes every Media occupies in one round trip. */
async function readUsage(
  client: Prisma.TransactionClient,
  excludeMediaId?: string,
): Promise<MediaUsageSnapshot> {
  const [settings, rows] = await Promise.all([
    client.settings.findFirst({ select: { mediaQuotaMb: true } }),
    client.media.findMany({
      where: excludeMediaId ? { id: { not: excludeMediaId } } : undefined,
      select: mediaUsageSelect,
    }),
  ]);

  return {
    usedBytes: mediaUsageBytes(rows.map(quotaUsageRow)),
    quotaMb: settings?.mediaQuotaMb ?? MEDIA_QUOTA_DEFAULT_MB,
  };
}

function assertQuotaFits(
  usedBytes: number,
  incomingBytes: number,
  quotaMb: number,
): void {
  if (fitsMediaQuota(usedBytes, incomingBytes, quotaMb)) return;

  throw new MediaQuotaExceededError(
    usedBytes,
    megabytesToBytes(quotaMb),
    quotaMb,
  );
}

export async function getMediaUsageBytes(): Promise<number> {
  return (await readUsage(db)).usedBytes;
}

export async function getMediaQuotaStatus(): Promise<MediaQuotaStatus> {
  const { usedBytes, quotaMb } = await readUsage(db);

  return mediaQuotaStatus(usedBytes, quotaMb);
}

/**
 * The transport-level check: refuses an upload before its bytes are written.
 * It only knows the file's own size, so the exact total (with renditions) is
 * checked again when the row is created.
 */
export async function assertMediaQuotaAllows(
  incomingBytes: number,
): Promise<void> {
  const { usedBytes, quotaMb } = await readUsage(db);

  assertQuotaFits(usedBytes, incomingBytes, quotaMb);
}

export interface MediaQuotaAdmission {
  /** Bytes this write will add: the original plus every rendition. */
  incomingBytes: number;
  /** A Media being replaced no longer counts against itself. */
  excludeMediaId?: string;
}

/**
 * Runs the row write inside a transaction that re-reads usage and admits the
 * Media only if it still fits. The advisory lock serialises concurrent
 * admissions, so an upload started a moment earlier is seen by the next one.
 */
export async function withMediaQuotaAdmission<T>(
  { incomingBytes, excludeMediaId }: MediaQuotaAdmission,
  write: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${MEDIA_QUOTA_LOCK_KEY})`;

    const { usedBytes, quotaMb } = await readUsage(tx, excludeMediaId);
    assertQuotaFits(usedBytes, incomingBytes, quotaMb);

    return write(tx);
  });
}
