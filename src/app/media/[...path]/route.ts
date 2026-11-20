import { NextResponse } from "next/server";

import { renditionUrlForKey } from "@/modules/media/lib/manifest";
import {
  findDeliveryFile,
  type DeliveryFile,
} from "@/modules/media/server/media-delivery";
import {
  isSafeStorageKey,
  pointsAtStorageRoute,
  redirectToRemote,
  streamLocalObject,
} from "@/modules/media/server/file-response";

function contentTypeForKey(key: string, file: DeliveryFile): string {
  if (key.endsWith("/original")) {
    return file.contentType ?? "application/octet-stream";
  }

  const extension = key.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "avif":
      return "image/avif";
    case "webp":
      return "image/webp";
    default:
      return file.contentType ?? "application/octet-stream";
  }
}

function remoteAddressFor(key: string, file: DeliveryFile): string | null {
  if (!file.rendition) return file.remoteUrl;

  // A rendition has no record of its own. Its provider address is the one the
  // manifest recorded when the bytes were written, so the hop never asks the
  // provider to resolve a key.
  return renditionUrlForKey(file.mediaUrl, key);
}

async function handleMediaRequest(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await params;
  const key = segments.join("/");

  if (!isSafeStorageKey(key)) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await findDeliveryFile(key);

  if (!file) {
    return new NextResponse(null, { status: 404 });
  }

  if (file.driver === "local") {
    return streamLocalObject({
      key,
      req,
      contentType: contentTypeForKey(key, file),
    });
  }

  const remoteAddress = remoteAddressFor(key, file);

  if (!remoteAddress || pointsAtStorageRoute(remoteAddress, "media")) {
    return new NextResponse(null, { status: 404 });
  }

  return redirectToRemote(req, remoteAddress);
}

export async function GET(
  req: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return handleMediaRequest(req, context);
}

export async function HEAD(
  req: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return handleMediaRequest(req, context);
}
