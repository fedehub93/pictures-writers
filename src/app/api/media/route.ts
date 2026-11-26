import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";

import {
  createMediaFromUpload,
  DuplicateMediaError,
  MediaProcessingError,
  type MediaUploadSource,
} from "@/modules/media/server/media-service";
import { MediaFolderNotFoundError } from "@/modules/media/server/media-folder-service";
import { assertStorageQuotaAllows } from "@/modules/media/server/media-quota";
import { quotaErrorResponse } from "@/modules/media/server/quota-error-response";
import { resolveActiveStorageDriver } from "@/modules/media/server/storage";

import { checkUploadFile, writeTemporaryUpload } from "./_lib/upload-transport";

/**
 * Machine-readable upload failures: the admin UI can tell a body that is not
 * multipart, an oversize file (answered by the transport itself), an exceeded
 * quota and a duplicate apart.
 */
function mediaUploadErrorResponse(error: unknown): NextResponse {
  if (error instanceof MediaFolderNotFoundError) {
    return NextResponse.json(
      {
        code: "MEDIA_FOLDER_NOT_FOUND",
        error:
          "The selected folder no longer exists. Upload into another folder or the My Drive root.",
      },
      { status: 404 },
    );
  }

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

/**
 * The library's only upload transport. The browser posts the file itself as
 * multipart; every byte is written by the active driver, so choosing local
 * disk needs no provider account.
 */
async function handleMultipartUpload(req: Request): Promise<Response> {
  const { driver, name: driverName } = await resolveActiveStorageDriver();
  const form = await req.formData();
  const file = form.get("file");
  const override = form.get("override") === "true";
  const folderField = form.get("folderId");
  const folderId =
    typeof folderField === "string" && folderField.trim()
      ? folderField.trim()
      : null;

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
    name: form.get("name")?.toString() || file.name,
    type: checked.type,
    altText: form.get("altText")?.toString() || null,
    mimeType: mimeType || null,
  };

  try {
    const media = await createMediaFromUpload({
      driver,
      storageDriver: driverName,
      source,
      folderId,
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

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          code: "UNSUPPORTED_CONTENT_TYPE",
          error: "Media uploads must be multipart/form-data.",
        },
        { status: 415 },
      );
    }

    return handleMultipartUpload(req).catch(mediaUploadErrorResponse);
  } catch (error) {
    console.log("[MEDIA_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
