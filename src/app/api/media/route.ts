import { NextResponse } from "next/server";

import { MediaType } from "@/generated/prisma";
import { authAdmin } from "@/lib/auth-service";

import {
  createMediaFromUpload,
  DuplicateMediaError,
  MediaProcessingError,
  type MediaUploadSource,
} from "@/modules/media/server/media-service";
import { assertStorageQuotaAllows } from "@/modules/media/server/media-quota";
import { quotaErrorResponse } from "@/modules/media/server/quota-error-response";
import { resolveActiveStorageDriver } from "@/modules/media/server/storage";

import { checkUploadFile, writeTemporaryUpload } from "./_lib/upload-transport";

type MediaUploadPayload = Partial<MediaUploadSource> & { override?: boolean };

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

  if (error instanceof MediaProcessingError) {
    console.log("[MEDIA_POST]", error);
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  const quota = quotaErrorResponse(error);
  if (quota) return quota;

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

  const mimeType = file.type;
  const checked = checkUploadFile(file);

  if (!checked.ok) return checked.response;

  // Refuse before the bytes reach storage. The exact total, including the
  // generated renditions, is checked again before the row is created.
  await assertStorageQuotaAllows({ incomingBytes: file.size });

  const tempKey = await writeTemporaryUpload(driver, file, mimeType);

  const source: MediaUploadSource = {
    key: tempKey,
    url: await driver.url(tempKey),
    name: form.get("name")?.toString() || file.name,
    type: checked.type,
    altText: form.get("altText")?.toString() || null,
    mimeType: mimeType || null,
    size: file.size,
  };

  try {
    const media = await createMediaFromUpload({
      driver,
      storageDriver: driverName,
      source,
      override,
      // The bytes reached storage through this endpoint, so every Media type is
      // written under its own revision and records the driver that wrote it.
      storeUploadedObject: true,
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
