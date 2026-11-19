import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";
import { MediaType } from "@/generated/prisma";
import { createMediaFromUpload } from "@/modules/media/server/media-service";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import type { StorageDriver } from "@/modules/media/server/storage/types";
import { createFakeUploadThingApi } from "@/modules/media/server/storage/__tests__/fake-uploadthing";
import { createUploadThingStorageDriver } from "@/modules/media/server/storage/uploadthing";

import { GET, HEAD } from "./route";

const storage = vi.hoisted(() => ({
  root: "" as string,
  local: undefined as StorageDriver | undefined,
  remote: undefined as StorageDriver | undefined,
}));

vi.mock("@/modules/media/server/storage", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/modules/media/server/storage")>();
  return {
    ...original,
    getLocalStorageRoot: () => storage.root,
    driverForStorageDriver: (name: string | null | undefined) =>
      name === "local" ? storage.local : storage.remote,
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
    storage.local = createLocalStorageDriver({ root: storage.root });
    const fake = createFakeUploadThingApi();
    storage.remote = createUploadThingStorageDriver(fake.api, fake.fetch);
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

    await storage.local!.put(key, bytes, "image/png");

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
    await storage.local!.put(key, new TextEncoder().encode(text), "text/plain");

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

  it("streams a rendition whose key belongs to a local Media", async () => {
    const { media } = await createLocalImage();
    const renditionKey = `default/${media.id}/1/720.avif`;
    const renditionBytes = await createPng();
    await storage.local!.put(renditionKey, renditionBytes, "image/avif");

    const response = await GET(
      new Request(`http://localhost/media/${renditionKey}`),
      context(renditionKey),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/avif");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      renditionBytes,
    );
  });

  it("answers 404 for a rendition key outside its Media revision", async () => {
    const { media } = await createLocalImage();
    const renditionKey = `default/${media.id}/2/720.avif`;

    const response = await GET(
      new Request(`http://localhost/media/${renditionKey}`),
      context(renditionKey),
    );

    expect(response.status).toBe(404);
  });

  it("redirects a remote Media to its provider URL", async () => {
    const key = `default/${randomUUID()}/1/original`;
    const bytes = await createPng();
    await storage.remote!.put(key, bytes, "image/png");

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

    const providerUrl = await storage.remote!.url(key);

    expect(response.status).toBe(302);
    expect(providerUrl).toMatch(/^https:\/\/fake-app\.ufs\.sh\/f\//);
    expect(response.headers.get("location")).toBe(providerUrl);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("treats a row with no recorded driver as remote", async () => {
    const key = `default/${randomUUID()}/1/original`;
    const bytes = await createPng();
    await storage.remote!.put(key, bytes, "image/png");

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
      await storage.remote!.url(key),
    );
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("serves a newly uploaded remote Media through /media/ and redirects to the provider", async () => {
    const sourceKey = `uploads/${randomUUID()}`;
    await storage.remote!.put(sourceKey, await createPng(), "image/png");

    const media = await createMediaFromUpload({
      driver: storage.remote!,
      storageDriver: "uploadthing",
      source: {
        key: sourceKey,
        url: `https://fake-app.ufs.sh/f/${sourceKey}`,
        name: "Fresh remote image",
        type: MediaType.IMAGE,
        altText: null,
      },
    });
    mediaIds.push(media.id);

    const deliveryUrl = new URL(media.url, "http://localhost");
    const key = deliveryUrl.pathname.replace(/^\/media\//, "");

    const response = await GET(
      new Request(`http://localhost${deliveryUrl.pathname}`),
      context(key),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      await storage.remote!.url(key),
    );
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("redirects a flat legacy key with no Installation segment to the provider", async () => {
    // Legacy Media rows kept UploadThing's generated file key rather than a
    // customId, and carry no recorded driver.
    const providerKey = "file-legacy-flat-key";
    await storage.remote!.put(
      "legacy-flat-key",
      new Uint8Array([1, 2, 3]),
      "image/png",
    );

    const media = await db.media.create({
      data: {
        id: randomUUID(),
        name: "Pre-seam image",
        key: providerKey,
        url: `https://fake-app.ufs.sh/f/${providerKey}`,
        type: MediaType.IMAGE,
        mimeType: "image/png",
        storageDriver: null,
      },
    });
    mediaIds.push(media.id);

    const response = await GET(
      new Request(`http://localhost/media/${providerKey}`),
      context(providerKey),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      `https://fake-app.ufs.sh/f/${encodeURIComponent(providerKey)}`,
    );
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });
});
