import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  archiveMedia,
  createMediaFromUpload,
} from "@/modules/media/server/media-service";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import type { StorageDriver } from "@/modules/media/server/storage/types";

import { DELETE } from "./route";

const storage = vi.hoisted(() => ({
  driver: undefined as StorageDriver | undefined,
}));

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

vi.mock("@/modules/media/server/storage", () => ({
  getStorageDriver: () => storage.driver,
}));

function request(body: unknown): Request {
  return new Request("http://localhost/api/media/bulk_delete", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("DELETE /api/media/bulk_delete", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-bulk-delete-route-"));
    driver = createLocalStorageDriver({ root, publicBaseUrl: "/media" });
    storage.driver = driver;
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  async function createMedia(color: { r: number; g: number; b: number }) {
    const key = `uploads/${randomUUID()}`;
    const bytes = await sharp({
      create: {
        width: 640,
        height: 480,
        channels: 3,
        background: color,
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
        name: "Bulk image",
        type: MediaType.IMAGE,
      },
    });
    mediaIds.push(media.id);

    return media;
  }

  it("permanently deletes archived media", async () => {
    const first = await createMedia({ r: 10, g: 20, b: 30 });
    const second = await createMedia({ r: 40, g: 50, b: 60 });
    await archiveMedia(first.id);
    await archiveMedia(second.id);

    const response = await DELETE(request([first.id, second.id]));

    expect(response.status).toBe(200);
    expect((await response.json()).deleted).toBe(2);
    await expect(
      db.media.count({ where: { id: { in: [first.id, second.id] } } }),
    ).resolves.toBe(0);
  });

  it("refuses the whole batch when one Media is not archived", async () => {
    const archived = await createMedia({ r: 70, g: 80, b: 90 });
    const active = await createMedia({ r: 100, g: 110, b: 120 });
    await archiveMedia(archived.id);

    const response = await DELETE(request([archived.id, active.id]));

    expect(response.status).toBe(409);
    await expect(
      db.media.count({ where: { id: { in: [archived.id, active.id] } } }),
    ).resolves.toBe(2);
  });

  it("refuses the whole batch when a Media is still referenced", async () => {
    const referenced = await createMedia({ r: 130, g: 140, b: 150 });
    const unreferenced = await createMedia({ r: 160, g: 170, b: 180 });
    const postRoot = await db.postRoot.create({
      data: { slug: `post-${randomUUID()}` },
    });
    const post = await db.postVersion.create({
      data: {
        title: "Cover",
        version: 1,
        rootId: postRoot.id,
        imageCoverId: referenced.id,
      },
    });
    await archiveMedia(referenced.id);
    await archiveMedia(unreferenced.id);

    try {
      const response = await DELETE(request([referenced.id, unreferenced.id]));

      expect(response.status).toBe(409);
      expect((await response.json()).usage).toBe(1);
      await expect(
        db.media.count({
          where: { id: { in: [referenced.id, unreferenced.id] } },
        }),
      ).resolves.toBe(2);
    } finally {
      await db.postVersion.delete({ where: { id: post.id } });
      await db.postRoot.delete({ where: { id: postRoot.id } });
    }
  });

  it("answers 400 when the body is not a list of ids", async () => {
    const response = await DELETE(request({ id: "nope" }));

    expect(response.status).toBe(400);
  });
});
