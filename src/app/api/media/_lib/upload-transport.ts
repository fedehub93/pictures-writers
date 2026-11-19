import { NextResponse } from "next/server";

import { MediaType } from "@/generated/prisma";
import { formatBytes } from "@/lib/format";

import { classifyMediaType } from "@/modules/media/lib/media-type";
import { mediaUploadLimitFor } from "@/modules/media/lib/upload-limits";
import type { StorageDriver } from "@/modules/media/server/storage";

export type CheckedUpload = {
  ok: true;
  type: MediaType;
  mimeType: string;
  maxBytes: number;
};

export type RefusedUpload = {
  ok: false;
  response: NextResponse;
};

/**
 * The checks every upload transport shares: classify the MIME type and apply
 * the type's size limit before a single byte reaches storage. Both the create
 * and the replace endpoints answer with the same machine-readable codes.
 */
export function checkUploadFile(file: File): CheckedUpload | RefusedUpload {
  const mimeType = file.type;
  const type = classifyMediaType(mimeType);

  if (!type) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          code: "UNSUPPORTED_MEDIA_TYPE",
          error:
            "This file type is not supported. Upload an image, document, audio or video file.",
          mimeType: mimeType || null,
        },
        { status: 415 },
      ),
    };
  }

  const maxBytes = mediaUploadLimitFor(type);

  if (file.size > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          code: "FILE_TOO_LARGE",
          error: `This file is larger than the ${formatBytes(
            maxBytes,
            0,
          )} upload limit.`,
          maxBytes,
        },
        { status: 413 },
      ),
    };
  }

  return { ok: true, type, mimeType, maxBytes };
}

/**
 * The application transport writes the request's bytes through the active
 * driver under a temporary key. The service turns that object into a Media and
 * removes it on every outcome; a temporary object is never addressable as one.
 */
export async function writeTemporaryUpload(
  driver: StorageDriver,
  file: File,
  mimeType: string,
): Promise<string> {
  const key = `tmp/${crypto.randomUUID()}`;
  await driver.put(key, new Uint8Array(await file.arrayBuffer()), mimeType);

  return key;
}
