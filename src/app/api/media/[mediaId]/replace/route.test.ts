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
import { getMediaUsageBytes } from "@/modules/media/server/media-quota";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import type { StorageDriver } from "@/modules/media/server/storage/types";
import {
  resetMediaQuota,
  setMediaQuotaMb,
} from "@/modules/media/server/__tests__/quota-fixtures";

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
  getStorageDriver: () => storage.driver,
  resolveStorageDriver: () => ({ driver: storage.driver, name: "local" }),
  // The suite also creates Media through the upload route, whose active driver
  // must be the temporary local driver.
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

function request(body: unknown): Request {
  return new Request("http://localhost/api/media/media-id/replace", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
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
    driver = createLocalStorageDriver({ root, publicBaseUrl: "/media" });
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
    const key = `uploads/${randomUUID()}`;
    await driver.put(key, bytes, "image/png");

    return {
      key,
      url: `https://ghhc7ejbae.ufs.sh/f/${key}`,
      name: "Route image",
      type: MediaType.IMAGE,
      altText: "",
    };
  }

  async function createMedia() {
    const { POST: create } = await import("../../route");
    const media = await (
      await create(request(await uploadImagePayload(await createPng())))
    ).json();
    mediaIds.push(media.id);

    return media;
  }

  it("replaces the file of an existing Media and answers with the new revision", async () => {
    const media = await createMedia();
    const payload = await uploadImagePayload(
      await createPng({ r: 210, g: 40, b: 60 }),
    );

    const response = await POST(request(payload), context(media.id));
    const replaced = await response.json();

    expect(response.status).toBe(200);
    expect(replaced).toMatchObject({
      id: media.id,
      revision: 2,
      key: `default/${media.id}/2/original`,
    });
  });

  it("answers 400 when no replacement file is provided", async () => {
    const media = await createMedia();

    const response = await POST(request({}), context(media.id));

    expect(response.status).toBe(400);
  });

  it("answers 404 for an unknown Media", async () => {
    const response = await POST(
      request(await uploadImagePayload(await createPng())),
      context(randomUUID()),
    );

    expect(response.status).toBe(404);
  });

  it("answers 422 and keeps the previous revision when processing fails", async () => {
    const media = await createMedia();
    const payload = await uploadImagePayload(await createPng());
    storage.driver = {
      ...driver,
      put: async (target, data, contentType) => {
        if (target.includes("/2/") && target.includes("/360.avif")) {
          throw new Error("simulated boom");
        }
        await driver.put(target, data, contentType);
      },
    };

    const response = await POST(request(payload), context(media.id));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toMatch(/could not be replaced/i);

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(row.revision).toBe(1);
  });

  it("answers 413 with the quota figures and keeps the previous revision", async () => {
    const media = await createMedia();
    const used = await getMediaUsageBytes();
    const current = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      select: { size: true, renditions: true },
    });
    const usedWithoutCurrent = used - mediaUsageBytes([current]);
    const quotaMb = Math.ceil((usedWithoutCurrent + 1) / MB);

    const filler = await db.media.create({
      data: {
        name: `quota-filler-${randomUUID()}`,
        url: `/media/quota-filler-${randomUUID()}`,
        size: quotaMb * MB - usedWithoutCurrent,
      },
    });
    mediaIds.push(filler.id);
    await setMediaQuotaMb(quotaMb);

    const payload = await uploadImagePayload(
      await createPng({ r: 210, g: 40, b: 60 }),
    );

    const response = await POST(request(payload), context(media.id));
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
    await expect(driver.get(payload.key)).rejects.toThrow();
  });
});
