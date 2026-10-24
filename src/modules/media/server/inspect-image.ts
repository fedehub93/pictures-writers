import "server-only";

import sharp from "sharp";

import type { MediaMetadata } from "@/modules/media/types";

import { blurDataUrl, checksumOf } from "./image-bytes";

const MIME_TYPES: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  tiff: "image/tiff",
  webp: "image/webp",
};

export interface InspectedImage {
  mimeType: string;
  size: number;
  checksum: string;
  metadata: MediaMetadata;
}

export function mimeTypeForImageFormat(format: string | undefined): string {
  if (!format) return "application/octet-stream";

  return MIME_TYPES[format.toLowerCase()] ?? `image/${format.toLowerCase()}`;
}

/**
 * Reads the original bytes once and derives everything the library and the
 * layout need. It never writes: the caller decides whether to persist.
 */
export async function inspectImage(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<InspectedImage> {
  const image = sharp(bytes, { failOn: "none" });
  const info = await image.metadata();

  const width = info.autoOrient?.width ?? info.width;
  const height = info.autoOrient?.height ?? info.height;

  return {
    mimeType: mimeTypeForImageFormat(info.format),
    size: bytes.byteLength,
    checksum: checksumOf(bytes),
    metadata: {
      width,
      height,
      ...(info.orientation !== undefined
        ? { orientation: info.orientation }
        : {}),
      blurDataURL: await blurDataUrl(bytes),
    },
  };
}
