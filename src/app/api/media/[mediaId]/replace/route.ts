import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";

import { replaceMediaFile } from "@/modules/media/server/media-service";
import { resolveActiveStorageDriver } from "@/modules/media/server/storage";

import { mediaErrorResponse } from "../../_lib/media-error-response";
import {
  checkUploadFile,
  writeTemporaryUpload,
} from "../../_lib/upload-transport";

export async function POST(
  req: Request,
  props: {
    params: Promise<{
      mediaId: string;
    }>;
  },
) {
  const { mediaId } = await props.params;

  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "A replacement file is required." },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A replacement file is required." },
        { status: 400 },
      );
    }

    const checked = checkUploadFile(file);

    if (!checked.ok) return checked.response;

    // Replace follows the same transport as an upload: the bytes enter through
    // the endpoint and are written by the active driver, never by the provider
    // the client happened to reach.
    const { driver, name } = await resolveActiveStorageDriver();
    const tempKey = await writeTemporaryUpload(driver, file, checked.mimeType);

    try {
      const result = await replaceMediaFile({
        driver,
        storageDriver: name,
        mediaId,
        source: { key: tempKey, mimeType: checked.mimeType || null },
      });

      return NextResponse.json(result);
    } catch (error) {
      // The service removes the temporary object on every outcome.
      return mediaErrorResponse(error, "[MEDIA_REPLACE]");
    }
  } catch (error) {
    console.log("[MEDIA_REPLACE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
