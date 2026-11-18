import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";

import type { MediaReplacementSource } from "@/modules/media/server/media-service";
import { replaceMediaFile } from "@/modules/media/server/media-service";
import { getStorageDriver } from "@/modules/media/server/storage";

import { mediaErrorResponse } from "../../_lib/media-error-response";

type MediaReplacementPayload = Partial<MediaReplacementSource>;

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
    const values = (await req.json()) as MediaReplacementPayload;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!values.key) {
      return NextResponse.json(
        { error: "A replacement file is required." },
        { status: 400 },
      );
    }

    const source: MediaReplacementSource = {
      key: values.key,
      mimeType: values.mimeType ?? null,
    };

    try {
      const media = await replaceMediaFile({
        driver: getStorageDriver(),
        mediaId,
        source,
      });

      return NextResponse.json(media);
    } catch (error) {
      return mediaErrorResponse(error, "[MEDIA_REPLACE]");
    }
  } catch (error) {
    console.log("[MEDIA_REPLACE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
