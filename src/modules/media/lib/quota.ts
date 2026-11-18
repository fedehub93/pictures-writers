/**
 * Media quota arithmetic.
 *
 * Pure and client-safe: the media library renders the same bytes the upload
 * endpoint enforces, so there is no second source of truth. Usage is the
 * original's size plus the bytes recorded in its rendition manifest, over every
 * Media, archived ones included.
 */

export const BYTES_PER_MEGABYTE = 1024 * 1024;

/** The default quota for an Installation that never changed it: 5 GB. */
export const MEDIA_QUOTA_DEFAULT_MB = 5120;

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
  ratio: number;
  percent: number;
  level: MediaQuotaLevel;
}

export function megabytesToBytes(megabytes: number): number {
  if (!Number.isFinite(megabytes) || megabytes <= 0) return 0;

  return Math.floor(megabytes) * BYTES_PER_MEGABYTE;
}

/**
 * Parses a quota submitted by a form field or a JSON body. A number input
 * sends a string, so both shapes are accepted; anything that is not a whole
 * number of megabytes, at least 1, is rejected.
 */
export function parseMediaQuotaMb(value: unknown): number | null {
  const quotaMb =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(quotaMb) && quotaMb >= 1 ? quotaMb : null;
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

export function mediaQuotaStatus(
  usedBytes: number,
  quotaMb: number,
): MediaQuotaStatus {
  const used = Number.isFinite(usedBytes) ? Math.max(0, usedBytes) : 0;
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

  return { usedBytes: used, totalBytes, ratio, percent, level };
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
  const used = Number.isFinite(usedBytes) ? Math.max(0, usedBytes) : 0;
  const incoming = Number.isFinite(incomingBytes)
    ? Math.max(0, incomingBytes)
    : 0;

  return used + incoming <= megabytesToBytes(quotaMb);
}
