/**
 * Pure, client-safe media domain types. They must not import Prisma or any
 * server-only module: the custom `next/image` loader shares them with the
 * server.
 */

export type MediaRenditionFormat = "avif" | "webp";

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
