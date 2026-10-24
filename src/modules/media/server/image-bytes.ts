import "server-only";

import { createHash } from "node:crypto";

import sharp from "sharp";

import { MEDIA_BLUR_WIDTH } from "@/modules/media/lib/image-ladder.mjs";

export const FALLBACK_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==";

export function checksumOf(bytes: Uint8Array<ArrayBuffer>): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function blurDataUrl(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<string> {
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
