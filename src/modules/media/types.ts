/**
 * Pure, client-safe media domain types. They must not import Prisma or any
 * server-only module: the custom `next/image` loader shares them with the
 * server.
 */

export type MediaRenditionFormat = "avif" | "webp";

/**
 * What happened to the objects of the revision a replace superseded.
 * `skipped`: the driver recorded on the row is not configured here;
 * `failed`: the bytes could not be removed, but the new revision is served.
 */
export type MediaCleanupStatus = "removed" | "skipped" | "failed";

/**
 * What happened to the objects of one permanently deleted Media. `skipped`
 * means the driver recorded on the row is unknown or not configured here, so
 * the bytes were deliberately left in place while the row was removed;
 * `reason` says which of the two it was.
 */
export interface MediaDeletionCleanup {
  mediaId: string;
  status: MediaCleanupStatus;
  reason?: string;
}

/**
 * One derived copy of a Media's original. `key` is the truth; the delivery
 * URL is a projection resolved by the storage driver when the manifest is
 * written into a delivery URL.
 */
export interface MediaRendition {
  key: string;
  width: number;
  height: number;
  bytes: number;
  format: MediaRenditionFormat;
}

/**
 * Per-type metadata. For images: intrinsic size (after EXIF orientation), the
 * original orientation tag and the blur placeholder. Never read on the
 * delivery path.
 */
export interface MediaMetadata {
  width?: number;
  height?: number;
  orientation?: number;
  blurDataURL?: string;
}
