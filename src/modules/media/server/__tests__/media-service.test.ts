import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { MEDIA_RENDITION_WIDTHS } from "@/modules/media/lib/image-ladder.mjs";
import { resolveMediaImageSource } from "@/modules/media/lib/image-loader";
import type { MediaRendition } from "@/modules/media/types";

import {
  createMediaFromUpload,
  DuplicateMediaError,
  MediaProcessingError,
} from "../media-service";
import { createLocalStorageDriver } from "../storage/local";
import {
  StorageObjectNotFoundError,
  type StorageDriver,
} from "../storage/types";

async function createPng(
  width = 2000,
  height = 1200,
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 20, g: 160, b: 80 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

function sourceFor(key: string) {
  return {
    key,
    url: `https://ghhc7ejbae.ufs.sh/f/${key}`,
    name: "Uploaded image",
    type: MediaType.IMAGE,
    altText: "Alt text",
  };
}

describe("createMediaFromUpload", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-service-"));
    driver = createLocalStorageDriver({ root, publicBaseUrl: "/media" });
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  async function putSource(
    bytes: Uint8Array<ArrayBuffer>,
    target: StorageDriver = driver,
  ): Promise<string> {
    const key = `uploads/${randomUUID()}`;
    await target.put(key, bytes, "image/png");
    return key;
  }

  async function createMedia(
    key: string,
    options: { override?: boolean; target?: StorageDriver } = {},
  ) {
    const media = await createMediaFromUpload({
      driver: options.target ?? driver,
      source: sourceFor(key),
      override: options.override,
    });

    mediaIds.push(media.id);
    return media;
  }

  it("writes the original and one object per ladder width and format", async () => {
    const bytes = await createPng();
    const key = await putSource(bytes);

    const media = await createMedia(key);

    expect(media).toMatchObject({
      name: "Uploaded image",
      type: MediaType.IMAGE,
      mimeType: "image/png",
      revision: 1,
      altText: "Alt text",
      archivedAt: null,
      checksum: createHash("sha256").update(bytes).digest("hex"),
    });
    expect(media.key).toBe(`${media.id}/1/original`);
    expect(media.size).toBe((await driver.get(media.key!)).byteLength);

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    const manifest = row.renditions as MediaRendition[];

    expect(row.metadata).toMatchObject({ width: 1920, height: 1152 });
    expect(manifest).toHaveLength(MEDIA_RENDITION_WIDTHS.length * 2);
    expect(manifest.map((rendition) => rendition.key).sort()).toEqual(
      MEDIA_RENDITION_WIDTHS.flatMap((width) =>
        ["avif", "webp"].map(
          (format) => `${media.id}/1/${width}.${format}`,
        ),
      ).sort(),
    );

    for (const rendition of manifest) {
      const stored = await driver.get(rendition.key);

      expect(stored.byteLength).toBe(rendition.bytes);
      expect(rendition.height).toBeGreaterThan(0);
      expect(rendition.width).toBeLessThanOrEqual(1920);
    }

    await expect(driver.get(key)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("delivers renditions immediately, without regenerating them", async () => {
    const bytes = await createPng();
    const key = await putSource(bytes);

    let puts = 0;
    const countingDriver: StorageDriver = {
      ...driver,
      put: async (target, data, contentType) => {
        puts += 1;
        await driver.put(target, data, contentType);
      },
    };

    const media = await createMedia(key, { target: countingDriver });
    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    const manifest = row.renditions as MediaRendition[];
    const putsAfterUpload = puts;

    expect(putsAfterUpload).toBe(manifest.length + 1);

    const avif960 = manifest.find(
      (rendition) => rendition.width === 960 && rendition.format === "avif",
    );
    const avif720 = manifest.find(
      (rendition) => rendition.width === 720 && rendition.format === "avif",
    );

    expect(avif960).toBeDefined();
    expect(avif720).toBeDefined();
    expect(resolveMediaImageSource(media.url, 960)).toBe(
      await driver.url(avif960!.key),
    );
    expect(resolveMediaImageSource(media.url, 900)).toBe(
      await driver.url(avif720!.key),
    );

    for (let index = 0; index < 5; index += 1) {
      resolveMediaImageSource(media.url, 720);
    }

    expect(puts).toBe(putsAfterUpload);
  });

  it("generates the full ladder even for a source smaller than the widest rendition", async () => {
    const bytes = await createPng(300, 200);
    const key = await putSource(bytes);

    const media = await createMedia(key);
    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    const manifest = row.renditions as MediaRendition[];

    expect(manifest.map((rendition) => rendition.width).sort((a, b) => a - b))
      .toEqual(
        MEDIA_RENDITION_WIDTHS.flatMap((width) => [width, width]).sort(
          (a, b) => a - b,
        ),
      );
  });

  it("refuses a duplicate checksum and points at the existing Media", async () => {
    const bytes = await createPng(400, 300);
    const first = await createMedia(await putSource(bytes));
    const secondKey = await putSource(bytes);

    const error = await createMedia(secondKey).catch((reason) => reason);

    expect(error).toBeInstanceOf(DuplicateMediaError);
    expect((error as DuplicateMediaError).existing.id).toBe(first.id);
    await expect(
      db.media.count({ where: { checksum: first.checksum! } }),
    ).resolves.toBe(1);
  });

  it("does not warn about a duplicate that is archived", async () => {
    const bytes = await createPng(400, 300);
    const archived = await createMedia(await putSource(bytes));
    await db.media.update({
      where: { id: archived.id },
      data: { archivedAt: new Date() },
    });

    const media = await createMedia(await putSource(bytes));

    expect(media.id).not.toBe(archived.id);
  });

  it("creates a second row with its own storage keys when overriding", async () => {
    const bytes = await createPng(400, 300);
    const first = await createMedia(await putSource(bytes));
    const overrideKey = await putSource(bytes);

    const second = await createMedia(overrideKey, { override: true });

    expect(second.id).not.toBe(first.id);
    expect(second.key).toBe(`${second.id}/1/original`);
    expect(second.key).not.toBe(first.key);
    expect(second.checksum).toBe(first.checksum);
    await expect(
      db.media.count({ where: { checksum: first.checksum! } }),
    ).resolves.toBe(2);
  });

  it("leaves no Media and no stored objects when processing fails", async () => {
    const bytes = await createPng();
    const key = await putSource(bytes);
    let prefix = "";

    const failingDriver: StorageDriver = {
      ...driver,
      put: async (target, data, contentType) => {
        if (target.includes("/360.avif")) throw new Error("simulated boom");
        await driver.put(target, data, contentType);
      },
      deletePrefix: async (value) => {
        prefix = value;
        return driver.deletePrefix(value);
      },
    };

    const error = await createMedia(key, { target: failingDriver }).catch(
      (reason) => reason,
    );

    expect(error).toBeInstanceOf(MediaProcessingError);
    expect(prefix).toMatch(/^[0-9a-f-]+\/$/);
    await expect(
      db.media.count({ where: { id: prefix.replace(/\/$/, "") } }),
    ).resolves.toBe(0);
    await expect(
      driver.deletePrefix(prefix.replace(/\/$/, "")),
    ).resolves.toBe(0);
  });

  it("reports an unreadable source without creating a row", async () => {
    const key = `uploads/${randomUUID()}`;

    const error = await createMedia(key).catch((reason) => reason);

    expect(error).toBeInstanceOf(MediaProcessingError);
    await expect(db.media.count({ where: { key: null } })).resolves.toBe(0);
  });

  it.each([MediaType.FILE, MediaType.AUDIO, MediaType.VIDEO])(
    "keeps %s uploads exactly as before",
    async (type) => {
      const media = await createMediaFromUpload({
        driver,
        source: {
          key: `uploads/${randomUUID()}`,
          url: "https://ghhc7ejbae.ufs.sh/f/legacy-attachment",
          name: "Attachment",
          type,
          mimeType: "application/octet-stream",
          size: 4321,
          altText: null,
        },
      });
      mediaIds.push(media.id);

      expect(media).toMatchObject({
        url: "https://ghhc7ejbae.ufs.sh/f/legacy-attachment",
        type,
        mimeType: "application/octet-stream",
        size: 4321,
        checksum: null,
        revision: 1,
      });

      const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
      expect(row.renditions).toBeNull();
    },
  );
});
