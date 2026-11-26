/**
 * Storage quota arithmetic.
 *
 * Pure and client-safe: the library renders the same bytes the upload
 * endpoints enforce, so there is no second source of truth. Usage is every
 * stored file's size plus the bytes recorded in a Media's rendition manifest,
 * archived ones included. A second figure names how much of the usage comes
 * from public-origin files, against the reserve that bounds them.
 */

import { MediaType } from "@/generated/prisma";

export const BYTES_PER_MEGABYTE = 1024 * 1024;

/** The order the library lists Media types in, whether or not one is present. */
export const MEDIA_TYPE_STORAGE_ORDER = [
  MediaType.IMAGE,
  MediaType.VIDEO,
  MediaType.AUDIO,
  MediaType.FILE,
] as const;

/** How many stored originals of one Media type the library holds, and their bytes. */
export interface MediaTypeUsage {
  type: MediaType;
  /** Number of Media originals; renditions are not separate files. */
  count: number;
  /** Stored original bytes. Renditions share the quota but are not counted here. */
  bytes: number;
}

/** The columns a per-type aggregation reads from each stored file. */
export interface MediaTypeUsageRow {
  /** Null for an attachment or avatar, which has no Media type. */
  type: MediaType | null;
  size: number | null;
}

/** The default quota for an Installation that never changed it: 5 GB. */
export const MEDIA_QUOTA_DEFAULT_MB = 5120;

/**
 * The default share of the quota public-origin files may occupy: 512 MB, a
 * tenth of the default quota. An Installation with no public forms never
 * reaches it, and internal uploads are never bounded by it.
 */
export const PUBLIC_ORIGIN_RESERVE_DEFAULT_MB = 512;

/** Above this share of the quota the library warns the admin. */
export const MEDIA_QUOTA_WARNING_RATIO = 0.8;

export type MediaQuotaLevel = "ok" | "warning" | "exceeded";

/** The columns the quota is counted from. */
export interface MediaQuotaUsageRow {
  size: number | null;
  renditions: unknown;
}

export interface MediaQuotaStatus {
  usedBytes: number;
  totalBytes: number;
  /** How much of `usedBytes` belongs to public-origin files. */
  publicBytes: number;
  /** The bytes public-origin files may occupy, inside `totalBytes`. */
  reserveBytes: number;
  ratio: number;
  percent: number;
  level: MediaQuotaLevel;
}

/** Everything the storage-details widget shows, read from one snapshot. */
export interface MediaStorageSnapshot {
  quota: MediaQuotaStatus;
  byMediaType: MediaTypeUsage[];
}

export function megabytesToBytes(megabytes: number): number {
  if (!Number.isFinite(megabytes) || megabytes <= 0) return 0;

  return Math.floor(megabytes) * BYTES_PER_MEGABYTE;
}

function parseWholeMegabytes(value: unknown, minimum: number): number | null {
  const megabytes =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(megabytes) && megabytes >= minimum
    ? megabytes
    : null;
}

/**
 * Parses a quota submitted by a form field or a JSON body. A number input
 * sends a string, so both shapes are accepted; anything that is not a whole
 * number of megabytes, at least 1, is rejected.
 */
export function parseMediaQuotaMb(value: unknown): number | null {
  return parseWholeMegabytes(value, 1);
}

/**
 * Parses the public-origin reserve. Zero is valid and refuses every public
 * upload; the reserve is a ceiling on visitors, not a floor for the owner.
 */
export function parsePublicOriginReserveMb(value: unknown): number | null {
  return parseWholeMegabytes(value, 0);
}

function nonNegativeBytes(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function renditionBytes(renditions: unknown): number {
  if (!Array.isArray(renditions)) return 0;

  let total = 0;

  for (const rendition of renditions) {
    if (typeof rendition !== "object" || rendition === null) continue;

    const bytes = (rendition as { bytes?: unknown }).bytes;
    if (typeof bytes === "number" && Number.isFinite(bytes) && bytes > 0) {
      total += bytes;
    }
  }

  return total;
}

/**
 * Sums originals and their rendition manifests over every row given. Callers
 * must not pre-filter archived Media: hiding a Media from the library does not
 * free its bytes.
 */
export function mediaUsageBytes(rows: MediaQuotaUsageRow[]): number {
  let total = 0;

  for (const row of rows) {
    const size = row.size;
    if (typeof size === "number" && Number.isFinite(size) && size > 0) {
      total += size;
    }

    total += renditionBytes(row.renditions);
  }

  return total;
}

/**
 * Groups stored originals by Media type. Every type is returned, in the order
 * the library lists them, so the widget does not have to invent an empty row.
 * Archived Media count, like they do against the quota; a record with no size
 * still counts as a file but contributes no bytes.
 */
export function mediaTypeUsage(rows: MediaTypeUsageRow[]): MediaTypeUsage[] {
  const totals = new Map<MediaType, { count: number; bytes: number }>();

  for (const type of MEDIA_TYPE_STORAGE_ORDER) {
    totals.set(type, { count: 0, bytes: 0 });
  }

  for (const row of rows) {
    if (row.type === null) continue;

    const total = totals.get(row.type);
    if (!total) continue;

    total.count += 1;

    if (
      typeof row.size === "number" &&
      Number.isFinite(row.size) &&
      row.size > 0
    ) {
      total.bytes += row.size;
    }
  }

  return MEDIA_TYPE_STORAGE_ORDER.map((type) => ({
    type,
    ...totals.get(type)!,
  }));
}

export function mediaQuotaStatus(
  usedBytes: number,
  quotaMb: number,
  publicBytes = 0,
  reserveMb: number = PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
): MediaQuotaStatus {
  const used = nonNegativeBytes(usedBytes);
  const publicUsed = nonNegativeBytes(publicBytes);
  const totalBytes = megabytesToBytes(quotaMb);
  const ratio = totalBytes > 0 ? used / totalBytes : used > 0 ? Infinity : 0;
  const percent =
    totalBytes > 0 ? Math.min(100, Math.round(ratio * 100)) : 100;

  const level: MediaQuotaLevel =
    used > totalBytes
      ? "exceeded"
      : ratio > MEDIA_QUOTA_WARNING_RATIO
        ? "warning"
        : "ok";

  return {
    usedBytes: used,
    totalBytes,
    publicBytes: publicUsed,
    reserveBytes: megabytesToBytes(reserveMb),
    ratio,
    percent,
    level,
  };
}

/**
 * Whether `incomingBytes` fit beside `usedBytes`. Exactly at the limit fits:
 * only a byte more is refused.
 */
export function fitsMediaQuota(
  usedBytes: number,
  incomingBytes: number,
  quotaMb: number,
): boolean {
  return (
    nonNegativeBytes(usedBytes) + nonNegativeBytes(incomingBytes) <=
    megabytesToBytes(quotaMb)
  );
}

/**
 * Whether a public-origin upload fits inside the reserve. Internal uploads
 * never call this: the reserve bounds visitors, not the owner.
 */
export function fitsPublicOriginReserve(
  publicBytes: number,
  incomingBytes: number,
  reserveMb: number,
): boolean {
  return (
    nonNegativeBytes(publicBytes) + nonNegativeBytes(incomingBytes) <=
    megabytesToBytes(reserveMb)
  );
}
