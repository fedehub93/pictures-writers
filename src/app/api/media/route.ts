import { NextResponse } from "next/server";

import { MediaType } from "@/generated/prisma";
import { formatBytes } from "@/lib/format";
import { authAdmin } from "@/lib/auth-service";

import {
  createMediaFromUpload,
  DuplicateMediaError,
  MediaProcessingError,
  type MediaUploadSource,
} from "@/modules/media/server/media-service";
import {
  assertMediaQuotaAllows,
  MediaQuotaExceededError,
} from "@/modules/media/server/media-quota";
import { resolveActiveStorageDriver } from "@/modules/media/server/storage";

/** Matches the image limit the media library enforced while UploadThing owned the transport. */
export const MEDIA_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

type MediaUploadPayload = Partial<MediaUploadSource> & { override?: boolean };

function mediaTypeFromMimeType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  if (mimeType.startsWith("audio/")) return MediaType.AUDIO;
  return MediaType.FILE;
}

function isMultipartRequest(req: Request): boolean {
  const contentType = req.headers.get("content-type") ?? "";
  return contentType.includes("multipart/form-data");
}

/**
 * Machine-readable upload failures: the admin UI can tell an oversize file
 * (answered by the transport itself), an exceeded quota and a duplicate apart.
 */
function mediaUploadErrorResponse(error: unknown): NextResponse {
  if (error instanceof DuplicateMediaError) {
    return NextResponse.json(
      { code: "DUPLICATE_MEDIA", duplicate: true, media: error.existing },
      { status: 409 },
    );
  }

  if (error instanceof MediaQuotaExceededError) {
    return NextResponse.json(
      {
        code: error.code,
        error: error.message,
        usedBytes: error.usedBytes,
        totalBytes: error.totalBytes,
        quotaMb: error.quotaMb,
      },
      { status: 413 },
    );
  }

  if (error instanceof MediaProcessingError) {
    console.log("[MEDIA_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  console.log("[MEDIA_POST]", error);
  return new NextResponse("Internal Error", { status: 500 });
}

async function handleMultipartUpload(req: Request): Promise<Response> {
  const { driver, name: driverName } = await resolveActiveStorageDriver();
  const form = await req.formData();
  const file = form.get("file");
  const override = form.get("override") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A file is required." },
      { status: 400 },
    );
  }

  const mimeType = file.type || "application/octet-stream";
  const type = mediaTypeFromMimeType(mimeType);

  if (type !== MediaType.IMAGE) {
    return NextResponse.json(
      { error: "Only image uploads are supported through multipart." },
      { status: 400 },
    );
  }

  if (file.size > MEDIA_MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        code: "FILE_TOO_LARGE",
        error: `This file is larger than the ${formatBytes(
          MEDIA_MAX_UPLOAD_BYTES,
          0,
        )} upload limit.`,
        maxBytes: MEDIA_MAX_UPLOAD_BYTES,
      },
      { status: 413 },
    );
  }

  // Refuse before the bytes reach storage. The exact total, including the
  // generated renditions, is checked again before the row is created.
  await assertMediaQuotaAllows(file.size);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const tempKey = `tmp/${crypto.randomUUID()}`;

  await driver.put(tempKey, bytes, mimeType);

  const source: MediaUploadSource = {
    key: tempKey,
    url: await driver.url(tempKey),
    name: form.get("name")?.toString() || file.name,
    type,
    altText: form.get("altText")?.toString() || null,
    mimeType,
    size: file.size,
  };

  try {
    const media = await createMediaFromUpload({
      driver,
      storageDriver: driverName,
      source,
      override,
    });

    return NextResponse.json(media);
  } catch (error) {
    // The processing failed after the temporary bytes were written; remove them
    // so a failed attempt never consumes storage.
    await driver.delete(tempKey).catch(() => undefined);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (isMultipartRequest(req)) {
      return handleMultipartUpload(req).catch(mediaUploadErrorResponse);
    }

    const values = (await req.json()) as MediaUploadPayload;

    if (!values.name || !values.url) {
      return NextResponse.json(
        { error: "A name and an uploaded file are required." },
        { status: 400 },
      );
    }

    const source: MediaUploadSource = {
      key: values.key ?? null,
      url: values.url,
      name: values.name,
      type: values.type ?? MediaType.FILE,
      altText: values.altText ?? null,
      mimeType: values.mimeType ?? null,
      size: values.size ?? null,
    };

    try {
      const { driver, name: driverName } = await resolveActiveStorageDriver();
      const media = await createMediaFromUpload({
        driver,
        storageDriver: driverName,
        source,
        override: values.override === true,
      });

      return NextResponse.json(media);
    } catch (error) {
      return mediaUploadErrorResponse(error);
    }
  } catch (error) {
    console.log("[MEDIA_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
