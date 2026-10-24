import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";

import { deleteMediaPermanentlyBatch } from "@/modules/media/server/media-service";
import { getStorageDriver } from "@/modules/media/server/storage";

import { mediaErrorResponse } from "../_lib/media-error-response";

export async function DELETE(req: Request) {
  try {
    const user = await authAdmin();
    const values = (await req.json()) as unknown;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (
      !Array.isArray(values) ||
      !values.every((value): value is string => typeof value === "string")
    ) {
      return NextResponse.json(
        { error: "A list of media ids is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteMediaPermanentlyBatch({
      driver: getStorageDriver(),
      mediaIds: values,
    });

    return NextResponse.json({ deleted });
  } catch (error) {
    return mediaErrorResponse(error, "[MEDIA_BULK_DELETE]");
  }
}
