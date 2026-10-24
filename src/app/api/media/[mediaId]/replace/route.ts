import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";

import type { MediaReplacementSource } from "@/modules/media/server/media-service";
import {
  MediaNotFoundError,
  MediaProcessingError,
  replaceMediaFile,
} from "@/modules/media/server/media-service";
import { getStorageDriver } from "@/modules/media/server/storage";

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
      if (error instanceof MediaNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error instanceof MediaProcessingError) {
        console.log("[MEDIA_REPLACE]", error);
        return NextResponse.json({ error: error.message }, { status: 422 });
      }

      throw error;
    }
  } catch (error) {
    console.log("[MEDIA_REPLACE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
