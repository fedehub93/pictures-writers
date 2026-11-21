import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { formatBytes } from "@/lib/format";

import {
  BYTES_PER_MEGABYTE,
  mediaUsageBytes,
} from "@/modules/media/lib/quota";
import { MEDIA_MAX_IMAGE_UPLOAD_BYTES } from "@/modules/media/lib/upload-limits";
import { getMediaUsageBytes } from "@/modules/media/server/media-quota";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import {
  StorageObjectNotFoundError,
  type StorageDriver,
} from "@/modules/media/server/storage/types";
import type { MediaRendition } from "@/modules/media/types";
import {
  resetMediaQuota,
  setMediaQuotaMb,
} from "@/modules/media/server/__tests__/quota-fixtures";

import { POST as postMedia } from "../../route";
import { POST } from "./route";

const MB = BYTES_PER_MEGABYTE;

const storage = vi.hoisted(() => ({
  driver: undefined as StorageDriver | undefined,
}));

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

vi.mock("@/modules/media/server/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/media/server/storage")>()),
  // Both the upload route that creates the fixture and the replace route under
  // test resolve the temporary local driver.
  resolveActiveStorageDriver: async () => ({
    driver: storage.driver,
    name: "local",
  }),
}));

async function createPng(
  background = { r: 30, g: 90, b: 210 },
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: { width: 800, height: 600, channels: 3, background },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

function multipartForm(
  bytes: Uint8Array<ArrayBuffer>,
  {
    mimeType = "image/png",
    fileName = "image.png",
    name,
  }: { mimeType?: string; fileName?: string; name?: string } = {},
): FormData {
  const form = new FormData();
  form.append("file", new File([bytes], fileName, { type: mimeType }));
  if (name) form.append("name", name);

  return form;
}

function createRequest(
  bytes: Uint8Array<ArrayBuffer>,
  options: { fileName?: string; name?: string } = {},
): Request {
  return new Request("http://localhost/api/media", {
    method: "POST",
    body: multipartForm(bytes, options),
  });
}

function replaceRequest(
  bytes: Uint8Array<ArrayBuffer>,
  options: { mimeType?: string; fileName?: string } = {},
): Request {
  return new Request("http://localhost/api/media/media-id/replace", {
    method: "POST",
    body: multipartForm(bytes, options),
  });
}

function context(mediaId: string) {
  return { params: Promise.resolve({ mediaId }) };
}

describe("POST /api/media/[mediaId]/replace", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-replace-route-"));
    driver = createLocalStorageDriver({ root });
    storage.driver = driver;
    // No test in this suite talks to a provider; a row recorded against
    // UploadThing is deliberately unconfigured here.
    vi.stubEnv("UPLOADTHING_TOKEN", "");
  });

  afterEach(async () => {
    await resetMediaQuota();

    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  async function createMedia(bytes?: Uint8Array<ArrayBuffer>) {
    const response = await postMedia(
      createRequest(bytes ?? (await createPng()), { name: "Route image" }),
    );
    const media = await response.json();
    mediaIds.push(media.id);

    return media;
  }

  it("replaces the file through the application transport and answers with the new revision", async () => {
    const media = await createMedia();
    const before = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    const previousRenditions = before.renditions as MediaRendition[];

    const response = await POST(
      replaceRequest(await createPng({ r: 210, g: 40, b: 60 })),
      context(media.id),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.media).toMatchObject({
      id: media.id,
      revision: 2,
      key: `default/${media.id}/2/original`,
      storageDriver: "local",
    });
    expect(body.previousRevisionCleanup).toBe("removed");

    for (const rendition of previousRenditions) {
      await expect(driver.get(rendition.key)).rejects.toBeInstanceOf(
        StorageObjectNotFoundError,
      );
    }
    await expect(driver.get(media.key!)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("no longer accepts a provider key, only a file through the transport", async () => {
    const media = await createMedia();

    const response = await POST(
      new Request("http://localhost/api/media/media-id/replace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: "provider-key" }),
      }),
      context(media.id),
    );

    expect(response.status).toBe(400);

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(row.revision).toBe(1);
  });

  it("answers 400 when no replacement file is provided", async () => {
    const media = await createMedia();

    const response = await POST(
      new Request("http://localhost/api/media/media-id/replace", {
        method: "POST",
        body: new FormData(),
      }),
      context(media.id),
    );

    expect(response.status).toBe(400);
  });

  it("answers 415 for a file whose type the library cannot classify", async () => {
    const media = await createMedia();

    const response = await POST(
      replaceRequest(new Uint8Array([1, 2, 3]), {
        mimeType: "application/octet-stream",
        fileName: "payload.bin",
      }),
      context(media.id),
    );
    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body.code).toBe("UNSUPPORTED_MEDIA_TYPE");

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(row.revision).toBe(1);
  });

  it("answers 413 for a file over the type's limit and keeps the previous revision", async () => {
    const media = await createMedia();

    const response = await POST(
      replaceRequest(new Uint8Array(MEDIA_MAX_IMAGE_UPLOAD_BYTES + 1), {
        fileName: "huge.png",
      }),
      context(media.id),
    );
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      code: "FILE_TOO_LARGE",
      maxBytes: MEDIA_MAX_IMAGE_UPLOAD_BYTES,
    });

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(row.revision).toBe(1);
  });

  it("answers 404 for an unknown Media", async () => {
    const response = await POST(
      replaceRequest(await createPng()),
      context(randomUUID()),
    );

    expect(response.status).toBe(404);
    // The temporary object is removed even when the Media does not exist.
    await expect(driver.deletePrefix("tmp/")).resolves.toBe(0);
  });

  it("answers 422 and keeps the previous revision, address and manifest when processing fails", async () => {
    const media = await createMedia();
    const before = await db.media.findUniqueOrThrow({ where: { id: media.id } });

    storage.driver = {
      ...driver,
      put: async (target, data, contentType) => {
        if (target.includes("/2/") && target.includes("/360.avif")) {
          throw new Error("simulated boom");
        }
        await driver.put(target, data, contentType);
      },
    };

    const response = await POST(
      replaceRequest(await createPng({ r: 210, g: 40, b: 60 })),
      context(media.id),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toMatch(/could not be replaced/i);

    const row = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      include: { storedFile: true },
    });
    expect(row.revision).toBe(1);
    expect(row.storedFile?.key).toBe(media.key);
    expect(row.renditions).toEqual(before.renditions);
    await expect(driver.deletePrefix("tmp/")).resolves.toBe(0);
  });

  it("answers 413 with the quota figures and keeps the previous revision", async () => {
    const media = await createMedia();
    const used = await getMediaUsageBytes();
    const current = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      select: { renditions: true, storedFile: { select: { size: true } } },
    });
    const usedWithoutCurrent =
      used -
      mediaUsageBytes([
        { size: current.storedFile?.size ?? null, renditions: current.renditions },
      ]);
    const quotaMb = Math.ceil((usedWithoutCurrent + 1) / MB);

    const fillerId = randomUUID();
    const filler = await db.media.create({
      data: {
        id: fillerId,
        name: `quota-filler-${fillerId}`,
        storedFile: {
          create: {
            key: `quota-filler-${fillerId}/1/original`,
            driver: "local",
            size: quotaMb * MB - usedWithoutCurrent,
          },
        },
      },
    });
    mediaIds.push(filler.id);
    await setMediaQuotaMb(quotaMb);

    const response = await POST(
      replaceRequest(await createPng({ r: 210, g: 40, b: 60 })),
      context(media.id),
    );
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      code: "MEDIA_QUOTA_EXCEEDED",
      totalBytes: quotaMb * MB,
    });
    expect(body.usedBytes).toBeGreaterThanOrEqual(0);
    expect(body.error).toContain(formatBytes(body.usedBytes));

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(row.revision).toBe(1);
    await expect(driver.deletePrefix("tmp/")).resolves.toBe(0);
  });

  it("replaces successfully and reports the cleanup as skipped when the previous provider is not configured", async () => {
    vi.stubEnv("UPLOADTHING_TOKEN", "");

    const mediaId = randomUUID();
    const legacy = await db.media.create({
      data: {
        id: mediaId,
        name: "Legacy provider image",
        type: MediaType.IMAGE,
        revision: 1,
        storedFile: {
          create: {
            key: "legacy-provider-key",
            driver: "uploadthing",
            remoteUrl: "https://old-provider.example/f/legacy-provider-key",
            contentType: "image/png",
            size: 1234,
          },
        },
      },
    });
    mediaIds.push(legacy.id);

    const response = await POST(
      replaceRequest(await createPng({ r: 90, g: 200, b: 60 })),
      context(mediaId),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.previousRevisionCleanup).toBe("skipped");
    expect(body.media).toMatchObject({
      id: mediaId,
      revision: 2,
      storageDriver: "local",
      key: `default/${mediaId}/2/original`,
    });
    await expect(driver.get(body.media.key)).resolves.toBeDefined();
  });
});
