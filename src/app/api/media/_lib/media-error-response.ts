import { NextResponse } from "next/server";

import {
  MediaNotFoundError,
  MediaProcessingError,
} from "@/modules/media/server/media-service";
import { MediaQuotaExceededError } from "@/modules/media/server/media-quota";

/**
 * Shared error mapping for the media API route that replaces a file. `tag` is
 * the log prefix for unexpected failures.
 */
export function mediaErrorResponse(error: unknown, tag: string): NextResponse {
  if (error instanceof MediaNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
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
    console.log(tag, error);
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  console.log(tag, error);
  return new NextResponse("Internal Error", { status: 500 });
}
