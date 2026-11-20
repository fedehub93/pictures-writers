import { NextResponse } from "next/server";

import {
  MediaNotFoundError,
  MediaProcessingError,
} from "@/modules/media/server/media-service";
import { quotaErrorResponse } from "@/modules/media/server/quota-error-response";

/**
 * Shared error mapping for the media API route that replaces a file. `tag` is
 * the log prefix for unexpected failures.
 */
export function mediaErrorResponse(error: unknown, tag: string): NextResponse {
  if (error instanceof MediaNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const quota = quotaErrorResponse(error);
  if (quota) return quota;

  if (error instanceof MediaProcessingError) {
    console.log(tag, error);
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  console.log(tag, error);
  return new NextResponse("Internal Error", { status: 500 });
}
