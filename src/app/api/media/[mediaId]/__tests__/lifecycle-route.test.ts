import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { createMediaFromUpload } from "@/modules/media/server/media-service";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import type { StorageDriver } from "@/modules/media/server/storage/types";

import { POST as archive } from "../archive/route";
import { POST as restore } from "../restore/route";
import { DELETE } from "../route";

const storage = vi.hoisted(() => ({
  driver: undefined as StorageDriver | undefined,
}));

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

vi.mock("@/modules/media/server/storage", () => ({
  getStorageDriver: () => storage.driver,
}));

function context(mediaId: string) {
  return { params: Promise.resolve({ mediaId }) };
}

function request(method = "POST"): Request {
  return new Request("http://localhost/api/media/media-id", { method });
}

describe("media lifecycle routes", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-lifecycle-route-"));
    driver = createLocalStorageDriver({ root, publicBaseUrl: "/media" });
    storage.driver = driver;
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  async function createMedia() {
    const key = `uploads/${randomUUID()}`;
    const bytes = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 20, g: 100, b: 180 },
      },
    })
      .png()
      .toBuffer();

    await driver.put(key, new Uint8Array(bytes), "image/png");

    const media = await createMediaFromUpload({
      driver,
      source: {
        key,
        url: `https://ghhc7ejbae.ufs.sh/f/${key}`,
        name: "Lifecycle image",
        type: MediaType.IMAGE,
      },
    });
    mediaIds.push(media.id);

    return media;
  }

  it("archives a Media and restores it", async () => {
    const media = await createMedia();

    const archived = await archive(request(), context(media.id));
    expect(archived.status).toBe(200);
    expect((await archived.json()).archivedAt).not.toBeNull();

    const restored = await restore(request(), context(media.id));
    expect(restored.status).toBe(200);
    expect((await restored.json()).archivedAt).toBeNull();
  });

  it("answers 404 for an unknown Media", async () => {
    const response = await archive(request(), context(randomUUID()));

    expect(response.status).toBe(404);
  });

  it("refuses permanent deletion of a Media that is not archived", async () => {
    const media = await createMedia();

    const response = await DELETE(request("DELETE"), context(media.id));

    expect(response.status).toBe(409);
    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.not.toBeNull();
  });

  it("permanently deletes an archived Media", async () => {
    const media = await createMedia();
    await archive(request(), context(media.id));

    const response = await DELETE(request("DELETE"), context(media.id));

    expect(response.status).toBe(200);
    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.toBeNull();
  });

  it("refuses permanent deletion while a cover references the Media", async () => {
    const media = await createMedia();
    const postRoot = await db.postRoot.create({
      data: { slug: `post-${randomUUID()}` },
    });
    const post = await db.postVersion.create({
      data: {
        title: "Referencing post",
        version: 1,
        rootId: postRoot.id,
        imageCoverId: media.id,
      },
    });
    await archive(request(), context(media.id));

    try {
      const response = await DELETE(request("DELETE"), context(media.id));
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.usage).toBe(1);

      const untouched = await db.postVersion.findUniqueOrThrow({
        where: { id: post.id },
      });
      expect(untouched.imageCoverId).toBe(media.id);
    } finally {
      await db.postVersion.delete({ where: { id: post.id } });
      await db.postRoot.delete({ where: { id: postRoot.id } });
    }
  });

  it("answers 401 without an admin session", async () => {
    const media = await createMedia();
    const auth = await import("@/lib/auth-service");
    const spy = vi.spyOn(auth, "authAdmin").mockResolvedValueOnce(null as never);

    try {
      const response = await archive(request(), context(media.id));

      expect(response.status).toBe(401);
    } finally {
      spy.mockRestore();
    }
  });
});
