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
  MediaNotFoundError,
  MediaProcessingError,
  replaceMediaFile,
} from "../media-service";
import { createLocalStorageDriver } from "../storage/local";
import {
  StorageObjectNotFoundError,
  type StorageDriver,
} from "../storage/types";

async function createPng(
  width = 2000,
  height = 1200,
  background = { r: 20, g: 160, b: 80 },
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background,
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

describe("replaceMediaFile", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-replace-"));
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
    contentType = "image/png",
  ): Promise<string> {
    const key = `uploads/${randomUUID()}`;
    await target.put(key, bytes, contentType);
    return key;
  }

  async function createImageMedia(key: string) {
    const media = await createMediaFromUpload({
      driver,
      source: sourceFor(key),
    });
    mediaIds.push(media.id);
    return media;
  }

  function replace(mediaId: string, key: string, target: StorageDriver = driver) {
    return replaceMediaFile({
      driver: target,
      mediaId,
      source: { key, mimeType: "image/png" },
    });
  }

  it("bumps the revision, writes new keys and removes the previous prefix", async () => {
    const first = await createImageMedia(await putSource(await createPng()));
    const before = await db.media.findUniqueOrThrow({ where: { id: first.id } });
    const previousManifest = before.renditions as MediaRendition[];
    const previousRenditionKeys = previousManifest.map((rendition) => rendition.key);

    const replacementBytes = await createPng(1200, 800, {
      r: 210,
      g: 40,
      b: 60,
    });
    const media = await replace(first.id, await putSource(replacementBytes));

    expect(media.id).toBe(first.id);
    expect(media.name).toBe("Uploaded image");
    expect(media.altText).toBe("Alt text");
    expect(media.revision).toBe(2);
    expect(media.key).toBe(`${first.id}/2/original`);
    expect(media.size).toBe((await driver.get(media.key!)).byteLength);

    const row = await db.media.findUniqueOrThrow({ where: { id: first.id } });
    const manifest = row.renditions as MediaRendition[];

    expect(row.checksum).toBe(
      createHash("sha256").update(replacementBytes).digest("hex"),
    );
    expect(manifest).toHaveLength(MEDIA_RENDITION_WIDTHS.length * 2);
    expect(
      manifest.every((rendition) => rendition.key.startsWith(`${first.id}/2/`)),
    ).toBe(true);

    for (const key of previousRenditionKeys) {
      await expect(driver.get(key)).rejects.toBeInstanceOf(
        StorageObjectNotFoundError,
      );
    }
    await expect(driver.get(before.key!)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("keeps delivering the new revision through the same Media", async () => {
    const first = await createImageMedia(await putSource(await createPng()));
    const media = await replace(
      first.id,
      await putSource(await createPng(1200, 800, { r: 210, g: 40, b: 60 })),
    );
    const row = await db.media.findUniqueOrThrow({ where: { id: first.id } });
    const manifest = row.renditions as MediaRendition[];
    const rendition = manifest.find(
      (entry) => entry.width === 720 && entry.format === "avif",
    );

    expect(resolveMediaImageSource(media.url, 720)).toBe(
      await driver.url(rendition!.key),
    );
  });

  it("keeps content references pointing at the same Media", async () => {
    const first = await createImageMedia(await putSource(await createPng()));
    const seo = await db.seo.create({
      data: {
        title: "Referencing content",
        version: 1,
        ogTwitterImageId: first.id,
      },
    });

    try {
      const replaced = await replace(
        first.id,
        await putSource(await createPng(1200, 800, { r: 210, g: 40, b: 60 })),
      );
      const after = await db.seo.findUniqueOrThrow({ where: { id: seo.id } });

      expect(replaced.id).toBe(first.id);
      expect(after.ogTwitterImageId).toBe(first.id);
    } finally {
      await db.seo.delete({ where: { id: seo.id } });
    }
  });

  it("leaves the previous revision intact and delivered when the replacement fails", async () => {
    const first = await createImageMedia(await putSource(await createPng()));
    const before = await db.media.findUniqueOrThrow({ where: { id: first.id } });
    const previousManifest = before.renditions as MediaRendition[];

    const failingDriver: StorageDriver = {
      ...driver,
      put: async (target, data, contentType) => {
        if (target.startsWith(`${first.id}/2/`) && target.includes("/360.avif")) {
          throw new Error("simulated boom");
        }
        await driver.put(target, data, contentType);
      },
    };

    const error = await replace(
      first.id,
      await putSource(await createPng(1200, 800, { r: 210, g: 40, b: 60 })),
      failingDriver,
    ).catch((reason) => reason);

    expect(error).toBeInstanceOf(MediaProcessingError);

    const row = await db.media.findUniqueOrThrow({ where: { id: first.id } });
    expect(row.revision).toBe(1);
    expect(row.key).toBe(before.key);
    expect(row.url).toBe(before.url);
    expect(row.renditions).toEqual(before.renditions);

    await expect(driver.get(before.key!)).resolves.toBeDefined();
    for (const rendition of previousManifest) {
      await expect(driver.get(rendition.key)).resolves.toBeDefined();
    }
    await expect(
      driver.deletePrefix(`${first.id}/2/`),
    ).resolves.toBe(0);
  });

  it("rejects an unknown Media without writing anything", async () => {
    const mediaId = randomUUID();

    await expect(
      replace(mediaId, await putSource(await createPng())),
    ).rejects.toBeInstanceOf(MediaNotFoundError);

    await expect(driver.deletePrefix(`${mediaId}/`)).resolves.toBe(0);
  });

  it("replaces a non-image file without generating renditions", async () => {
    const oldBytes = new Uint8Array([1, 2, 3, 4]);
    const media = await createMediaFromUpload({
      driver,
      source: {
        key: await putSource(oldBytes, driver, "application/pdf"),
        url: "https://ghhc7ejbae.ufs.sh/f/legacy.pdf",
        name: "Brochure.pdf",
        type: MediaType.FILE,
        mimeType: "application/pdf",
        size: 4,
        altText: null,
      },
    });
    mediaIds.push(media.id);

    const newBytes = new Uint8Array([9, 8, 7, 6, 5, 4, 3]);
    const replaced = await replaceMediaFile({
      driver,
      mediaId: media.id,
      source: {
        key: await putSource(newBytes, driver, "application/pdf"),
        mimeType: "application/pdf",
      },
    });

    expect(replaced).toMatchObject({
      id: media.id,
      type: MediaType.FILE,
      revision: 2,
      key: `${media.id}/2/original`,
      size: newBytes.byteLength,
      mimeType: "application/pdf",
      checksum: createHash("sha256").update(newBytes).digest("hex"),
    });

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(row.renditions).toBeNull();
    expect(new Uint8Array(await driver.get(row.key!))).toEqual(newBytes);
    await expect(driver.get(media.key!)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });
});
