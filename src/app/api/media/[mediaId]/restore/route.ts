import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";

import { restoreMedia } from "@/modules/media/server/media-service";

import { mediaErrorResponse } from "../../_lib/media-error-response";

export async function POST(
  _req: Request,
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

    const media = await restoreMedia(mediaId);

    return NextResponse.json(media);
  } catch (error) {
    return mediaErrorResponse(error, "[MEDIA_RESTORE]");
  }
}
