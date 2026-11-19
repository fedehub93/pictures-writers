import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { MEDIA_PATH_PREFIX } from "@/modules/media/lib/image-ladder.mjs";
import { renditionUrlForKey } from "@/modules/media/lib/manifest";
import { parseSrc } from "@/modules/media/lib/url";
import {
  findDeliveryFile,
  type DeliveryFile,
} from "@/modules/media/server/media-delivery";
import { getLocalStorageRoot } from "@/modules/media/server/storage";

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
// The provider hop points at bytes that a later move can take away. It is
// cached for minutes, never immutably: only the bytes behind it are immutable.
const REDIRECT_CACHE = "public, max-age=300";

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
  file: DeliveryFile,
): Promise<Response> {
  const root = getLocalStorageRoot();
  const filePath = path.join(root, ...key.split("/"));
  const stats = await stat(filePath).catch(() => null);

  if (!stats || !stats.isFile()) {
    return new NextResponse(null, { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": contentTypeForKey(key, file),
    ETag: etagForKey(key),
    "Cache-Control": IMMUTABLE_CACHE,
    "Accept-Ranges": "bytes",
    "Content-Length": String(stats.size),
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
    headers,
  });
}

function remoteAddressFor(key: string, file: DeliveryFile): string | null {
  if (!file.rendition) return file.remoteUrl;

  // A rendition has no record of its own. Its provider address is the one the
  // manifest recorded when the bytes were written, so the hop never asks the
  // provider to resolve a key.
  return renditionUrlForKey(file.mediaUrl, key);
}

/**
 * A manifest written while the file was local carries `/media/<key>` addresses.
 * If a later move records the file as remote without rewriting that manifest,
 * redirecting to it would send the visitor back to this route forever. The
 * inconsistent record answers 404 instead.
 */
function pointsAtThisRoute(address: string): boolean {
  const { url, absolute } = parseSrc(address);
  if (absolute) return false;

  return (
    url.pathname === MEDIA_PATH_PREFIX ||
    url.pathname.startsWith(`${MEDIA_PATH_PREFIX}/`)
  );
}

async function handleMediaRequest(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await params;
  const key = segments.join("/");

  if (!isSafeMediaKey(key)) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await findDeliveryFile(key);

  if (!file) {
    return new NextResponse(null, { status: 404 });
  }

  if (file.driver === "local") {
    return streamLocalObject(key, req, file);
  }

  const remoteAddress = remoteAddressFor(key, file);

  if (!remoteAddress || pointsAtThisRoute(remoteAddress)) {
    return new NextResponse(null, { status: 404 });
  }

  // The redirect must always be absolute, while a recorded address may be
  // relative to this Installation.
  const absoluteUrl = new URL(remoteAddress, req.url).toString();

  return NextResponse.redirect(absoluteUrl, {
    status: 302,
    headers: { "Cache-Control": REDIRECT_CACHE },
  });
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
