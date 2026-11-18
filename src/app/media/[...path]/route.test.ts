import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";
import { MediaType } from "@/generated/prisma";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import type { StorageDriver } from "@/modules/media/server/storage/types";

import { GET, HEAD } from "./route";

const storage = vi.hoisted(() => ({ root: "" as string, driver: undefined as StorageDriver | undefined }));

vi.mock("@/modules/media/server/storage", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/modules/media/server/storage")>();
  return {
    ...original,
    getLocalStorageRoot: () => storage.root,
    driverForStorageDriver: () => storage.driver,
  };
});

async function createPng(): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 20, g: 100, b: 180 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

function context(key: string) {
  // Next.js catch-all segments omit the leading /media
  const segments = key.split("/").filter(Boolean);
  return { params: Promise.resolve({ path: segments }) };
}

function etagForKey(key: string): string {
  return `"${createHash("sha256").update(key).digest("hex")}"`;
}

describe("GET /media/<key>", () => {
  let mediaIds: string[];

  beforeEach(async () => {
    mediaIds = [];
    storage.root = await mkdtemp(path.join(tmpdir(), "media-delivery-"));
    storage.driver = createLocalStorageDriver({ root: storage.root, publicBaseUrl: "/media" });
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(storage.root, { recursive: true, force: true });
  });

  async function createLocalImage(keyOverride?: string) {
    const bytes = await createPng();
    const id = randomUUID();
    const key = keyOverride ?? `default/${id}/1/original`;

    await storage.driver!.put(key, bytes, "image/png");

    const media = await db.media.create({
      data: {
        id,
        name: "Delivery image",
        key,
        url: `/media/${key}`,
        type: MediaType.IMAGE,
        mimeType: "image/png",
        size: bytes.byteLength,
        storageDriver: "local",
      },
    });

    mediaIds.push(media.id);
    return { media, bytes, key };
  }

  it("streams a local image with content type, ETag and immutable cache", async () => {
    const { bytes, key } = await createLocalImage();

    const response = await GET(
      new Request(`http://localhost/media/${key}`),
      context(key),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("etag")).toBe(etagForKey(key));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("returns the same headers with no body for HEAD", async () => {
    const { key } = await createLocalImage();

    const response = await HEAD(
      new Request(`http://localhost/media/${key}`, { method: "HEAD" }),
      context(key),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("etag")).toBe(etagForKey(key));
    expect(await response.text()).toBe("");
  });

  it("answers a Range request with partial content", async () => {
    const text = "0123456789";
    const key = `default/${randomUUID()}/1/original`;
    await storage.driver!.put(key, new TextEncoder().encode(text), "text/plain");

    const media = await db.media.create({
      data: {
        id: randomUUID(),
        name: "Range file",
        key,
        url: `/media/${key}`,
        type: MediaType.FILE,
        mimeType: "text/plain",
        size: text.length,
        storageDriver: "local",
      },
    });
    mediaIds.push(media.id);

    const response = await GET(
      new Request(`http://localhost/media/${key}`, {
        headers: { range: "bytes=2-5" },
      }),
      context(key),
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(await response.text()).toBe("2345");
  });

  it("answers 404 for an unknown key", async () => {
    const key = `default/${randomUUID()}/1/original`;

    const response = await GET(
      new Request(`http://localhost/media/${key}`),
      context(key),
    );

    expect(response.status).toBe(404);
  });

  it("answers 404 for a traversal segment without touching storage", async () => {
    const key = "default/../etc/passwd";

    const response = await GET(
      new Request(`http://localhost/media/${encodeURI(key)}`),
      context(key),
    );

    expect(response.status).toBe(404);
  });

  it("answers 404 for an absolute path segment", async () => {
    const key = "/etc/passwd";

    const response = await GET(
      new Request(`http://localhost/media${key}`),
      context(key),
    );

    expect(response.status).toBe(404);
  });

  it("redirects a remote Media to its provider URL", async () => {
    const key = `default/${randomUUID()}/1/original`;
    const bytes = await createPng();
    await storage.driver!.put(key, bytes, "image/png");

    const media = await db.media.create({
      data: {
        id: randomUUID(),
        name: "Remote image",
        key,
        url: `/media/${key}`,
        type: MediaType.IMAGE,
        mimeType: "image/png",
        storageDriver: "uploadthing",
      },
    });
    mediaIds.push(media.id);

    const response = await GET(
      new Request(`http://localhost/media/${key}`),
      context(key),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      new URL(await storage.driver!.url(key), `http://localhost/media/${key}`).toString(),
    );
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("treats a row with no recorded driver as remote", async () => {
    const key = `default/${randomUUID()}/1/original`;
    const bytes = await createPng();
    await storage.driver!.put(key, bytes, "image/png");

    const media = await db.media.create({
      data: {
        id: randomUUID(),
        name: "Legacy image",
        key,
        url: `/media/${key}`,
        type: MediaType.IMAGE,
        mimeType: "image/png",
        storageDriver: null,
      },
    });
    mediaIds.push(media.id);

    const response = await GET(
      new Request(`http://localhost/media/${key}`),
      context(key),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      new URL(await storage.driver!.url(key), `http://localhost/media/${key}`).toString(),
    );
  });
});
