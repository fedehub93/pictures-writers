import "server-only";

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import {
  FILES_PATH_PREFIX,
  storedFileAddress,
  type StoredFileAddressArea,
} from "@/modules/media/lib/file-path";
import { MEDIA_PATH_PREFIX } from "@/modules/media/lib/image-ladder.mjs";
import { parseSrc } from "@/modules/media/lib/url";

import { getLocalStorageRoot } from "./storage";

export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
// The provider hop points at bytes that a later move can take away. It is
// cached for minutes, never immutably: only the bytes behind it are immutable.
export const REDIRECT_CACHE = "public, max-age=300";

export function isSafeStorageKey(key: string): boolean {
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

export function etagForKey(key: string): string {
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

/**
 * Streams one local object with the headers every stored file shares. A
 * missing object is a 404, never a stack trace, and a Range request answers
 * 206 so documents, audio and video can be downloaded and seeked as usual.
 */
export async function streamLocalObject({
  key,
  req,
  contentType,
}: {
  key: string;
  req: Request;
  contentType: string;
}): Promise<Response> {
  const root = getLocalStorageRoot();
  const filePath = path.join(root, ...key.split("/"));
  const stats = await stat(filePath).catch(() => null);

  if (!stats || !stats.isFile()) {
    return new NextResponse(null, { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    // An attachment may be any file type, including HTML or SVG. A sandboxed
    // document gets a unique origin and cannot run script on this domain.
    "Content-Security-Policy": "sandbox",
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

/**
 * A recorded address that points back at the route currently answering would
 * send the visitor in a loop. An address under the other prefix is a real
 * destination, not a loop: an old attachment may legitimately still live at a
 * `/media/<key>` address.
 */
export function pointsAtStorageRoute(
  address: string,
  route: StoredFileAddressArea,
): boolean {
  const { url, absolute } = parseSrc(address);
  // A provider address is absolute by definition; its path is the provider's,
  // even when a segment happens to be called /files.
  if (absolute) return false;

  const parsed = storedFileAddress(address);
  if (parsed) return parsed.area === route;

  return (
    url.pathname === (route === "media" ? MEDIA_PATH_PREFIX : FILES_PATH_PREFIX)
  );
}

/**
 * Redirects to the recorded provider address. The hop is always absolute and
 * never immutable, so a later move does not leave a cached redirect pointing
 * at a deleted object.
 */
export function redirectToRemote(
  req: Request,
  remoteAddress: string,
): Response {
  const absoluteUrl = new URL(remoteAddress, req.url).toString();

  return NextResponse.redirect(absoluteUrl, {
    status: 302,
    headers: { "Cache-Control": REDIRECT_CACHE },
  });
}
