import "server-only";

import { createHash } from "node:crypto";

import sharp from "sharp";

import { MEDIA_BLUR_WIDTH } from "@/modules/media/lib/image-ladder.mjs";
import type { MediaMetadata } from "@/modules/media/types";

const FALLBACK_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==";

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

function mimeTypeFor(format: string | undefined): string {
  if (!format) return "application/octet-stream";

  return MIME_TYPES[format.toLowerCase()] ?? `image/${format.toLowerCase()}`;
}

async function blurDataUrl(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  try {
    const buffer = await sharp(bytes, { failOn: "none" })
      .autoOrient()
      .resize({ width: MEDIA_BLUR_WIDTH, withoutEnlargement: true })
      .webp({ quality: 40 })
      .toBuffer();

    return `data:image/webp;base64,${buffer.toString("base64")}`;
  } catch {
    return FALLBACK_BLUR_DATA_URL;
  }
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
    mimeType: mimeTypeFor(info.format),
    size: bytes.byteLength,
    checksum: createHash("sha256").update(bytes).digest("hex"),
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
