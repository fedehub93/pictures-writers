import { mkdtemp, rm } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { formatBytes } from "@/lib/format";

import { BYTES_PER_MEGABYTE } from "@/modules/media/lib/quota";
import {
  archiveMedia,
  deleteMediaPermanentlyBatch,
} from "@/modules/media/server/media-service";
import { getMediaUsageBytes } from "@/modules/media/server/media-quota";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import type { StorageDriver } from "@/modules/media/server/storage/types";
import {
  resetMediaQuota,
  setMediaQuotaMb,
} from "@/modules/media/server/__tests__/quota-fixtures";

import {
  MEDIA_MAX_IMAGE_UPLOAD_BYTES,
  MEDIA_MAX_NON_IMAGE_UPLOAD_BYTES,
  POST,
} from "./route";

const MB = BYTES_PER_MEGABYTE;

const storage = vi.hoisted(() => ({ driver: undefined as unknown }));

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

vi.mock("@/modules/media/server/storage", () => ({
  getStorageDriver: () => storage.driver,
  resolveStorageDriver: () => ({ driver: storage.driver, name: "local" }),
  resolveActiveStorageDriver: async () => ({
    driver: storage.driver,
    name: "local",
  }),
  getInstallationSlug: () => "default",
}));

async function createPng(): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 30, g: 90, b: 210 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

async function createNoisePng(
  width = 500,
  height = 500,
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp(randomBytes(width * height * 3), {
    raw: { width, height, channels: 3 },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

function request(body: unknown): Request {
  return new Request("http://localhost/api/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/media", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-route-"));
    driver = createLocalStorageDriver({ root });
    storage.driver = driver;
  });

  afterEach(async () => {
    await resetMediaQuota();

    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  async function uploadImagePayload(bytes: Uint8Array<ArrayBuffer>) {
    const key = `uploads/${crypto.randomUUID()}`;
    await driver.put(key, bytes, "image/png");

    return {
      key,
      url: `https://ghhc7ejbae.ufs.sh/f/${key}`,
      name: "Route image",
      type: MediaType.IMAGE,
      altText: "",
    };
  }

  it("processes an uploaded image and returns the Media row", async () => {
    const response = await POST(request(await uploadImagePayload(await createPng())));
    const media = await response.json();

    mediaIds.push(media.id);

    expect(response.status).toBe(200);
    expect(media).toMatchObject({
      name: "Route image",
      type: MediaType.IMAGE,
      mimeType: "image/png",
      revision: 1,
    });
    expect(media.key).toBe(`default/${media.id}/1/original`);
  });

  it("answers 409 with the existing Media on a duplicate checksum", async () => {
    const bytes = await createPng();
    const first = await (
      await POST(request(await uploadImagePayload(bytes)))
    ).json();
    mediaIds.push(first.id);

    const response = await POST(request(await uploadImagePayload(bytes)));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      duplicate: true,
      media: { id: first.id, name: "Route image" },
    });
  });

  it("creates a second row when the admin overrides the duplicate warning", async () => {
    const bytes = await createPng();
    const first = await (
      await POST(request(await uploadImagePayload(bytes)))
    ).json();
    mediaIds.push(first.id);

    const payload = await uploadImagePayload(bytes);
    const response = await POST(request({ ...payload, override: true }));
    const second = await response.json();
    mediaIds.push(second.id);

    expect(response.status).toBe(200);
    expect(second.id).not.toBe(first.id);
    expect(second.key).toBe(`default/${second.id}/1/original`);
  });

  it("answers 422 and creates no row when processing fails", async () => {
    const key = `uploads/${crypto.randomUUID()}`;
    await driver.put(key, new Uint8Array([1, 2, 3]), "image/png");

    const response = await POST(
      request({
        key,
        url: `https://ghhc7ejbae.ufs.sh/f/${key}`,
        name: "Broken",
        type: MediaType.IMAGE,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toMatch(/could not be processed/i);
    await expect(
      db.media.count({ where: { name: "Broken" } }),
    ).resolves.toBe(0);
  });

  function multipartRequest(form: FormData): Request {
    return new Request("http://localhost/api/media", {
      method: "POST",
      body: form,
    });
  }

  it("accepts a multipart image upload and returns a namespaced Media", async () => {
    const bytes = await createPng();
    const file = new File([bytes], "multipart.png", { type: "image/png" });
    const form = new FormData();
    form.append("file", file);
    form.append("name", "Multipart image");

    const response = await POST(multipartRequest(form));
    const media = await response.json();

    mediaIds.push(media.id);

    expect(response.status).toBe(200);
    expect(media).toMatchObject({
      name: "Multipart image",
      type: MediaType.IMAGE,
      mimeType: "image/png",
      storageDriver: "local",
      revision: 1,
    });
    expect(media.key).toBe(`default/${media.id}/1/original`);
    expect(media.url).toContain(`/media/default/${media.id}/1/original`);
    expect(media.url).not.toContain("://");

    const stored = await driver.get(media.key);
    expect(stored.byteLength).toBe(media.size);
  });

  it("rejects a multipart upload whose type the library cannot classify", async () => {
    const file = new File(["hello"], "blob.bin", {
      type: "application/octet-stream",
    });
    const form = new FormData();
    form.append("file", file);
    form.append("name", "Blob");

    const response = await POST(multipartRequest(form));
    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body).toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
      mimeType: "application/octet-stream",
    });
    await expect(
      db.media.count({ where: { name: "Blob" } }),
    ).resolves.toBe(0);
  });

  it.each([
    ["document", "application/pdf", "brochure.pdf", MediaType.FILE],
    ["audio", "audio/mpeg", "track.mp3", MediaType.AUDIO],
    ["video", "video/mp4", "clip.mp4", MediaType.VIDEO],
  ])(
    "stores a multipart %s under its own revision and records the driver",
    async (_label, mimeType, fileName, expectedType) => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const form = new FormData();
      form.append("file", new File([bytes], fileName, { type: mimeType }));
      form.append("name", `Multipart ${fileName}`);

      const response = await POST(multipartRequest(form));
      const media = await response.json();
      mediaIds.push(media.id);

      expect(response.status).toBe(200);
      expect(media).toMatchObject({
        type: expectedType,
        mimeType,
        storageDriver: "local",
        size: bytes.byteLength,
        revision: 1,
        checksum: expect.any(String),
      });
      expect(media.key).toBe(`default/${media.id}/1/original`);
      expect(media.url).toBe(`/media/${media.key}`);
      await expect(driver.get(media.key)).resolves.toEqual(bytes);

      const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
      expect(row.renditions).toBeNull();
    },
  );

  it("answers 413 for a non-image over the 16 MB limit", async () => {
    const form = new FormData();
    form.append(
      "file",
      new File(
        [new Uint8Array(MEDIA_MAX_NON_IMAGE_UPLOAD_BYTES + 1)],
        "huge.pdf",
        { type: "application/pdf" },
      ),
    );
    form.append("name", "Huge document");

    const response = await POST(multipartRequest(form));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      code: "FILE_TOO_LARGE",
      maxBytes: MEDIA_MAX_NON_IMAGE_UPLOAD_BYTES,
    });
    await expect(
      db.media.count({ where: { name: "Huge document" } }),
    ).resolves.toBe(0);
  });

  it("refuses an image over 4 MB even when it is under the non-image limit", async () => {
    const form = new FormData();
    form.append(
      "file",
      new File(
        [new Uint8Array(MEDIA_MAX_IMAGE_UPLOAD_BYTES + 1)],
        "large.png",
        { type: "image/png" },
      ),
    );
    form.append("name", "Large image");

    const response = await POST(multipartRequest(form));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      code: "FILE_TOO_LARGE",
      maxBytes: MEDIA_MAX_IMAGE_UPLOAD_BYTES,
    });
  });

  it("answers 409 for a duplicate non-image checksum", async () => {
    const bytes = new Uint8Array([9, 8, 7, 6, 5]);

    const upload = () => {
      const form = new FormData();
      form.append("file", new File([bytes], "report.pdf", { type: "application/pdf" }));
      form.append("name", "Duplicate document");
      return multipartRequest(form);
    };

    const first = await (await POST(upload())).json();
    mediaIds.push(first.id);

    const response = await POST(upload());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      code: "DUPLICATE_MEDIA",
      duplicate: true,
      media: { id: first.id },
    });
  });

  it("creates a second row when a duplicate multipart upload is overridden", async () => {
    const bytes = await createPng();
    const file = new File([bytes], "duplicate.png", { type: "image/png" });
    const form = new FormData();
    form.append("file", file);
    form.append("name", "Duplicate multipart");

    const first = await (await POST(multipartRequest(form))).json();
    mediaIds.push(first.id);

    const secondForm = new FormData();
    secondForm.append("file", new File([bytes], "duplicate2.png", { type: "image/png" }));
    secondForm.append("name", "Duplicate multipart");
    secondForm.append("override", "true");

    const response = await POST(multipartRequest(secondForm));
    const second = await response.json();
    mediaIds.push(second.id);

    expect(response.status).toBe(200);
    expect(second.id).not.toBe(first.id);
    expect(second.key).toBe(`default/${second.id}/1/original`);
  });

  it("answers 422 and removes the temporary object when a multipart image fails processing", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "broken.png", {
      type: "image/png",
    });
    const form = new FormData();
    form.append("file", file);
    form.append("name", "Broken multipart");

    const response = await POST(multipartRequest(form));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toMatch(/could not be processed/i);
    await expect(
      db.media.count({ where: { name: "Broken multipart" } }),
    ).resolves.toBe(0);
  });

  it("records a non-image upload without generating renditions", async () => {
    const response = await POST(
      request({
        key: "uploads/legacy.pdf",
        url: "https://ghhc7ejbae.ufs.sh/f/legacy.pdf",
        name: "Brochure.pdf",
        type: MediaType.FILE,
        mimeType: "application/pdf",
        size: 1234,
      }),
    );
    const media = await response.json();
    mediaIds.push(media.id);

    expect(response.status).toBe(200);
    expect(media).toMatchObject({
      key: "uploads/legacy.pdf",
      url: "https://ghhc7ejbae.ufs.sh/f/legacy.pdf",
      type: MediaType.FILE,
      mimeType: "application/pdf",
    });

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(row.renditions).toBeNull();
  });

  it("answers 413 FILE_TOO_LARGE for a file over the transport limit", async () => {
    const form = new FormData();
    form.append(
      "file",
      new File([new Uint8Array(MEDIA_MAX_IMAGE_UPLOAD_BYTES + 1)], "huge.png", {
        type: "image/png",
      }),
    );
    form.append("name", "Huge multipart");

    const response = await POST(multipartRequest(form));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      code: "FILE_TOO_LARGE",
      maxBytes: MEDIA_MAX_IMAGE_UPLOAD_BYTES,
    });
    await expect(
      db.media.count({ where: { name: "Huge multipart" } }),
    ).resolves.toBe(0);
  });

  it("refuses an upload past the quota before writing any bytes", async () => {
    await setMediaQuotaMb(1);

    const puts: string[] = [];
    storage.driver = {
      ...driver,
      put: async (key, data, contentType) => {
        puts.push(key);
        await driver.put(key, data, contentType);
      },
    } satisfies StorageDriver;

    const form = new FormData();
    form.append(
      "file",
      new File([new Uint8Array(2 * MB)], "over.png", { type: "image/png" }),
    );
    form.append("name", "Over quota");

    const response = await POST(multipartRequest(form));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      code: "MEDIA_QUOTA_EXCEEDED",
      quotaMb: 1,
      totalBytes: MB,
    });
    expect(body.usedBytes).toBeGreaterThanOrEqual(0);
    expect(body.error).toContain(formatBytes(body.usedBytes));
    expect(body.error).toContain(formatBytes(MB));
    expect(puts).toEqual([]);
    await expect(
      db.media.count({ where: { name: "Over quota" } }),
    ).resolves.toBe(0);
  });

  it("refuses a non-image past the quota before writing any bytes", async () => {
    await setMediaQuotaMb(1);

    const puts: string[] = [];
    storage.driver = {
      ...driver,
      put: async (key, data, contentType) => {
        puts.push(key);
        await driver.put(key, data, contentType);
      },
    } satisfies StorageDriver;

    const form = new FormData();
    form.append(
      "file",
      new File([new Uint8Array(2 * MB)], "over-quota.pdf", {
        type: "application/pdf",
      }),
    );
    form.append("name", "Over quota document");

    const response = await POST(multipartRequest(form));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      code: "MEDIA_QUOTA_EXCEEDED",
      quotaMb: 1,
      totalBytes: MB,
    });
    expect(puts).toEqual([]);
    await expect(
      db.media.count({ where: { name: "Over quota document" } }),
    ).resolves.toBe(0);
  });

  it("accepts the same upload again after enough media is deleted", async () => {
    const noise = await createNoisePng(700, 700);

    const hogForm = new FormData();
    hogForm.append("file", new File([noise], "hog.png", { type: "image/png" }));
    hogForm.append("name", "Quota hog");

    const hogResponse = await POST(multipartRequest(hogForm));
    const hog = await hogResponse.json();
    mediaIds.push(hog.id);

    const used = await getMediaUsageBytes();
    const quotaMb = Math.ceil((used + 1) / MB);
    await setMediaQuotaMb(quotaMb);

    const retryForm = () => {
      const form = new FormData();
      form.append(
        "file",
        new File([noise], "hog.png", { type: "image/png" }),
      );
      form.append("name", "Quota retry");
      return form;
    };

    const refused = await POST(multipartRequest(retryForm()));
    const refusedBody = await refused.json();

    expect(refused.status).toBe(413);
    expect(refusedBody).toMatchObject({
      code: "MEDIA_QUOTA_EXCEEDED",
      usedBytes: used,
      totalBytes: quotaMb * MB,
    });
    await expect(
      db.media.count({ where: { name: "Quota retry" } }),
    ).resolves.toBe(0);

    await archiveMedia(hog.id);
    await deleteMediaPermanentlyBatch({ driver, mediaIds: [hog.id] });
    mediaIds.splice(mediaIds.indexOf(hog.id), 1);

    const retried = await POST(multipartRequest(retryForm()));
    const retriedBody = await retried.json();
    mediaIds.push(retriedBody.id);

    expect(retried.status).toBe(200);
    expect(retriedBody.key).toBe(`default/${retriedBody.id}/1/original`);
  });
});
