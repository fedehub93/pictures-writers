import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";
import { MediaType } from "@/generated/prisma";
import { buildMediaDeliveryUrl } from "@/modules/media/lib/manifest";
import { mediaPath } from "@/modules/media/lib/url";
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
    driverForStorageDriver: () => storage.remote,
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
  let providerUrlReads: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mediaIds = [];
    storage.root = await mkdtemp(path.join(tmpdir(), "media-delivery-"));
    storage.local = createLocalStorageDriver({ root: storage.root });
    const fake = createFakeUploadThingApi();
    storage.remote = createUploadThingStorageDriver(fake.api, fake.fetch);
    providerUrlReads = vi.spyOn(fake.api, "getFileUrls");
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(storage.root, { recursive: true, force: true });
  });

  interface MediaFixture {
    id?: string;
    key: string;
    url?: string;
    type?: MediaType;
    mimeType?: string | null;
    size?: number | null;
    storageDriver?: string | null;
  }

  async function createMedia(fixture: MediaFixture) {
    const media = await db.media.create({
      data: {
        id: fixture.id ?? randomUUID(),
        name: "Delivery fixture",
        key: fixture.key,
        url: fixture.url ?? `/media/${fixture.key}`,
        type: fixture.type ?? MediaType.IMAGE,
        mimeType:
          fixture.mimeType === undefined ? "image/png" : fixture.mimeType,
        size: fixture.size ?? null,
        storageDriver:
          fixture.storageDriver === undefined ? "local" : fixture.storageDriver,
      },
    });

    mediaIds.push(media.id);
    return media;
  }

  async function createStoredFile(
    media: { id: string; key: string | null },
    location: {
      driver?: string;
      remoteUrl?: string | null;
      contentType?: string | null;
      size?: number | null;
    } = {},
  ) {
    return db.storedFile.create({
      data: {
        key: media.key as string,
        driver: location.driver ?? "local",
        remoteUrl: location.remoteUrl ?? null,
        contentType: location.contentType ?? "image/png",
        size: location.size ?? null,
        mediaId: media.id,
      },
    });
  }

  async function createLocalImage() {
    const bytes = await createPng();
    const id = randomUUID();
    const key = `default/${id}/1/original`;

    await storage.local!.put(key, bytes, "image/png");

    // The Media's own columns carry no content type on purpose: the response
    // must come from the stored-file record.
    const media = await createMedia({
      id,
      key,
      mimeType: null,
      size: bytes.byteLength,
    });
    await createStoredFile(media, {
      contentType: "image/png",
      size: bytes.byteLength,
    });

    return { media, bytes, key };
  }

  it("streams a local image from its stored-file location with content type, ETag and immutable cache", async () => {
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
    expect(response.headers.get("content-length")).toBe(String(bytes.byteLength));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("streams a local document with its recorded type, byte length and Range support", async () => {
    const text = "0123456789";
    const key = `default/${randomUUID()}/1/original`;
    await storage.local!.put(key, new TextEncoder().encode(text), "text/plain");

    const media = await createMedia({
      key,
      type: MediaType.FILE,
      mimeType: null,
      size: text.length,
    });
    await createStoredFile(media, {
      contentType: "text/plain",
      size: text.length,
    });

    const response = await GET(
      new Request(`http://localhost/media/${key}`),
      context(key),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(response.headers.get("content-length")).toBe(String(text.length));
    expect(await response.text()).toBe(text);

    const ranged = await GET(
      new Request(`http://localhost/media/${key}`, {
        headers: { range: "bytes=2-5" },
      }),
      context(key),
    );

    expect(ranged.status).toBe(206);
    expect(ranged.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(await ranged.text()).toBe("2345");
  });

  it("returns the same headers and byte length with no body for HEAD", async () => {
    const { bytes, key } = await createLocalImage();

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
    expect(response.headers.get("content-length")).toBe(String(bytes.byteLength));
    expect(await response.text()).toBe("");
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

  it("answers 404 when the recorded file is missing from disk", async () => {
    const key = `default/${randomUUID()}/1/original`;
    const media = await createMedia({ key, size: 10 });
    await createStoredFile(media, { contentType: "text/plain", size: 10 });

    const response = await GET(
      new Request(`http://localhost/media/${key}`),
      context(key),
    );

    expect(response.status).toBe(404);
  });

  it("streams a rendition whose key belongs to a local Media without a record of its own", async () => {
    const { media } = await createLocalImage();
    const renditionKey = `default/${media.id}/1/720.avif`;
    const renditionBytes = await createPng();
    await storage.local!.put(renditionKey, renditionBytes, "image/avif");

    expect(
      await db.storedFile.count({ where: { key: renditionKey } }),
    ).toBe(0);

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

  it("redirects a remote file to its recorded location with a short cache", async () => {
    const key = `default/${randomUUID()}/1/original`;
    const remoteUrl = "https://cdn.example.test/files/original.png";
    const media = await createMedia({
      key,
      storageDriver: "uploadthing",
    });
    await createStoredFile(media, { driver: "uploadthing", remoteUrl });

    const response = await GET(
      new Request(`http://localhost/media/${key}`),
      context(key),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(remoteUrl);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect(response.headers.get("cache-control")).not.toContain("immutable");
    expect(providerUrlReads).not.toHaveBeenCalled();
  });

  it("resolves a Media with no recorded driver from its remote location", async () => {
    // A pre-seam row may have no stored-file record yet; its own absolute
    // address still names where the bytes are, without a provider call.
    const providerKey = "file-legacy-flat-key";
    const remoteUrl = `https://fake-app.ufs.sh/f/${providerKey}`;

    await createMedia({
      key: providerKey,
      url: remoteUrl,
      storageDriver: null,
    });

    const response = await GET(
      new Request(`http://localhost/media/${providerKey}`),
      context(providerKey),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(remoteUrl);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect(providerUrlReads).not.toHaveBeenCalled();
  });

  it("redirects a remote rendition to the address its Media manifest records without reading the provider", async () => {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const renditionKey = `default/${id}/1/720.avif`;
    const renditionUrl = "https://cdn.example.test/files/720.avif";

    const url = buildMediaDeliveryUrl(mediaPath(key), {
      revision: 1,
      archived: false,
      renditions: [{ url: renditionUrl, width: 720, format: "avif" }],
    });

    const media = await createMedia({
      id,
      key,
      url,
      storageDriver: "uploadthing",
    });
    await createStoredFile(media, {
      driver: "uploadthing",
      remoteUrl: "https://cdn.example.test/files/original",
    });

    const response = await GET(
      new Request(`http://localhost/media/${renditionKey}`),
      context(renditionKey),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(renditionUrl);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect(providerUrlReads).not.toHaveBeenCalled();
  });

  it("answers 404 rather than redirecting a remote rendition back to its own route", async () => {
    // A manifest written while the file was local carries /media/<key>; a
    // remote record whose manifest still names it must not loop.
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const renditionKey = `default/${id}/1/720.avif`;

    const url = buildMediaDeliveryUrl(mediaPath(key), {
      revision: 1,
      archived: false,
      renditions: [
        { url: `/media/${renditionKey}`, width: 720, format: "avif" },
      ],
    });

    const media = await createMedia({
      id,
      key,
      url,
      storageDriver: "uploadthing",
    });
    await createStoredFile(media, {
      driver: "uploadthing",
      remoteUrl: "https://cdn.example.test/files/original",
    });

    const response = await GET(
      new Request(`http://localhost/media/${renditionKey}`),
      context(renditionKey),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
    expect(providerUrlReads).not.toHaveBeenCalled();
  });

  it("serves a newly uploaded remote Media through /media/ and redirects to the recorded provider location", async () => {
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
    const stored = await db.storedFile.findUnique({ where: { mediaId: media.id } });

    providerUrlReads.mockClear();

    const response = await GET(
      new Request(`http://localhost${deliveryUrl.pathname}`),
      context(key),
    );

    expect(stored?.remoteUrl).toMatch(/^https:\/\/fake-app\.ufs\.sh\/f\//);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(stored?.remoteUrl);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect(providerUrlReads).not.toHaveBeenCalled();
  });

  it("answers 404 rather than a stack trace when a remote record carries no provider address", async () => {
    const key = `default/${randomUUID()}/1/original`;
    const media = await createMedia({
      key,
      storageDriver: "uploadthing",
    });
    await createStoredFile(media, { driver: "uploadthing", remoteUrl: null });

    const response = await GET(
      new Request(`http://localhost/media/${key}`),
      context(key),
    );

    expect(response.status).toBe(404);
  });
});
