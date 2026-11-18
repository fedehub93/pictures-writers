import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { findDeliveryMedia } from "@/modules/media/server/media-delivery";
import {
  driverForStorageDriver,
  getLocalStorageRoot,
} from "@/modules/media/server/storage";
import { StorageObjectNotFoundError } from "@/modules/media/server/storage/types";

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

function isSafeMediaKey(key: string): boolean {
  if (
    key.length === 0 ||
    key.startsWith("/") ||
    key.includes("\\") ||
    key.includes("\0")
  ) {
    return false;
  }

  return !key.split("/").some(
    (segment) =>
      segment.length === 0 || segment === "." || segment === "..",
  );
}

function contentTypeForKey(
  key: string,
  mediaMimeType: string | null,
): string {
  if (key.endsWith("/original")) {
    return mediaMimeType ?? "application/octet-stream";
  }

  const extension = key.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "avif":
      return "image/avif";
    case "webp":
      return "image/webp";
    default:
      return mediaMimeType ?? "application/octet-stream";
  }
}

function etagForKey(key: string): string {
  return `"${createHash("sha256").update(key).digest("hex")}"`;
}

interface ParsedRange {
  start: number;
  end: number;
}

function parseRange(range: string, size: number): ParsedRange | null {
  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;

  const start = match[1] ? Number.parseInt(match[1], 10) : undefined;
  const end = match[2] ? Number.parseInt(match[2], 10) : undefined;

  if (start !== undefined && Number.isNaN(start)) return null;
  if (end !== undefined && Number.isNaN(end)) return null;

  if (start === undefined && end === undefined) return null;

  if (start === undefined) {
    // suffix range: last N bytes
    const suffix = Math.min(end ?? 0, size);
    return { start: size - suffix, end: size - 1 };
  }

  if (end === undefined) {
    return { start, end: size - 1 };
  }

  return { start, end };
}

async function streamLocalObject(
  key: string,
  req: Request,
  mediaMimeType: string | null,
): Promise<Response> {
  const root = getLocalStorageRoot();
  const filePath = path.join(root, ...key.split("/"));
  const stats = await stat(filePath).catch(() => null);

  if (!stats || !stats.isFile()) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = contentTypeForKey(key, mediaMimeType);
  const etag = etagForKey(key);
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    ETag: etag,
    "Cache-Control": IMMUTABLE_CACHE,
    "Accept-Ranges": "bytes",
  };

  if (req.method === "HEAD") {
    return new NextResponse(null, { status: 200, headers });
  }

  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, stats.size);
    if (!range || range.start >= stats.size || range.end >= stats.size) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${stats.size}` },
      });
    }

    const contentLength = range.end - range.start + 1;
    const stream = createReadStream(filePath, {
      start: range.start,
      end: range.end,
    });

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(contentLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${stats.size}`,
      },
    });
  }

  const stream = createReadStream(filePath);

  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      ...headers,
      "Content-Length": String(stats.size),
    },
  });
}

async function handleMediaRequest(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const key = path.join("/");

  if (!isSafeMediaKey(key)) {
    return new NextResponse(null, { status: 404 });
  }

  const media = await findDeliveryMedia(key);

  if (!media || !media.key) {
    return new NextResponse(null, { status: 404 });
  }

  if (media.storageDriver === "local") {
    return streamLocalObject(key, req, media.mimeType);
  }

  // Remote driver (or a legacy row with no recorded driver): redirect to the
  // provider's CDN so the existing Installation keeps serving its files.
  try {
    const driver = driverForStorageDriver(media.storageDriver);
    const url = await driver.url(key);

    // Driver URLs may be absolute provider origins or relative local addresses.
    // The redirect must always be absolute.
    const absoluteUrl = new URL(url, req.url).toString();

    return NextResponse.redirect(absoluteUrl, {
      status: 302,
      headers: { "Cache-Control": IMMUTABLE_CACHE },
    });
  } catch (error) {
    if (error instanceof StorageObjectNotFoundError) {
      return new NextResponse(null, { status: 404 });
    }

    console.error("[MEDIA_DELIVERY]", error);
    return new NextResponse(null, { status: 500 });
  }
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
