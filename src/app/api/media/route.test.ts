import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import type { StorageDriver } from "@/modules/media/server/storage/types";

import { POST } from "./route";

const storage = vi.hoisted(() => ({ driver: undefined as unknown }));

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

vi.mock("@/modules/media/server/storage", () => ({
  getStorageDriver: () => storage.driver,
  resolveStorageDriver: () => ({ driver: storage.driver, name: "local" }),
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
    driver = createLocalStorageDriver({ root, publicBaseUrl: "/media" });
    storage.driver = driver;
  });

  afterEach(async () => {
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

  it("rejects a multipart upload that is not an image", async () => {
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    const form = new FormData();
    form.append("file", file);
    form.append("name", "Note");

    const response = await POST(multipartRequest(form));

    expect(response.status).toBe(400);
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
});
