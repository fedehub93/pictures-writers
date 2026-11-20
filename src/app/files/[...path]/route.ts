import { NextResponse } from "next/server";

import {
  isSafeStorageKey,
  pointsAtStorageRoute,
  redirectToRemote,
  streamLocalObject,
} from "@/modules/media/server/file-response";
import { findOwnedDeliveryFile } from "@/modules/media/server/media-delivery";

/**
 * Delivery for every stored file that is not a library Media: email and form
 * attachments, and user avatars. The address is always on the Installation's
 * own domain; the recorded driver decides whether the bytes are streamed from
 * disk or the request is redirected to the provider that still holds them.
 */
async function handleFileRequest(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await params;
  const key = segments.join("/");

  if (!isSafeStorageKey(key)) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await findOwnedDeliveryFile(key);

  if (!file) {
    return new NextResponse(null, { status: 404 });
  }

  if (file.driver === "local") {
    return streamLocalObject({
      key,
      req,
      contentType: file.contentType ?? "application/octet-stream",
    });
  }

  if (!file.remoteUrl || pointsAtStorageRoute(file.remoteUrl, "files")) {
    return new NextResponse(null, { status: 404 });
  }

  return redirectToRemote(req, file.remoteUrl);
}

export async function GET(
  req: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return handleFileRequest(req, context);
}

export async function HEAD(
  req: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return handleFileRequest(req, context);
}
