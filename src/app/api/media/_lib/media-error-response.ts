import { NextResponse } from "next/server";

import {
  MediaInUseError,
  MediaNotArchivedError,
  MediaNotFoundError,
  MediaProcessingError,
} from "@/modules/media/server/media-service";

/**
 * Shared error mapping for the media API routes that act on a Media's
 * lifecycle. `tag` is the log prefix for unexpected failures.
 */
export function mediaErrorResponse(error: unknown, tag: string): NextResponse {
  if (error instanceof MediaNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof MediaNotArchivedError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof MediaInUseError) {
    return NextResponse.json(
      { error: error.message, usage: error.usage },
      { status: 409 },
    );
  }

  if (error instanceof MediaProcessingError) {
    console.log(tag, error);
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  console.log(tag, error);
  return new NextResponse("Internal Error", { status: 500 });
}
