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
import {
  MEDIA_MANIFEST_PARAM,
  decodeMediaManifest,
  stripMediaManifest,
} from "@/modules/media/lib/manifest";
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
import { createFakeUploadThingApi } from "../storage/__tests__/fake-uploadthing";
import { createUploadThingStorageDriver } from "../storage/uploadthing";

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
    driver = createLocalStorageDriver({ root });
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
      storageDriver: "local",
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
    expect(media.key).toBe(`default/${media.id}/1/original`);
    expect(media.size).toBe((await driver.get(media.key!)).byteLength);

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    const manifest = row.renditions as MediaRendition[];

    expect(row.metadata).toMatchObject({ width: 1920, height: 1152 });
    expect(manifest).toHaveLength(MEDIA_RENDITION_WIDTHS.length * 2);
    expect(manifest.map((rendition) => rendition.key).sort()).toEqual(
      MEDIA_RENDITION_WIDTHS.flatMap((width) =>
        ["avif", "webp"].map(
          (format) => `default/${media.id}/1/${width}.${format}`,
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

  it("stores the canonical relative address for a remote upload and embeds the provider origin in the manifest", async () => {
    const fake = createFakeUploadThingApi();
    const remote = createUploadThingStorageDriver(fake.api, fake.fetch);
    const key = await putSource(await createPng(), remote);

    const media = await createMediaFromUpload({
      driver: remote,
      storageDriver: "uploadthing",
      source: sourceFor(key),
    });
    mediaIds.push(media.id);

    expect(stripMediaManifest(media.url)).toBe(`/media/${media.key}`);
    expect(media.url).not.toContain("://");

    const manifest = decodeMediaManifest(
      new URL(media.url, "http://localhost").searchParams.get(
        MEDIA_MANIFEST_PARAM,
      ),
    );

    expect(manifest?.renditions.length).toBeGreaterThan(0);
    for (const rendition of manifest!.renditions) {
      expect(rendition.url).toMatch(/^https:\/\/fake-app\.ufs\.sh\/f\//);
    }

    // The public site renders the rendition straight from the provider and
    // falls back to the canonical address, which the delivery route redirects.
    const avif960 = manifest!.renditions.find(
      (rendition) => rendition.width === 960 && rendition.format === "avif",
    );
    expect(resolveMediaImageSource(media.url, 960)).toBe(avif960!.url);
    expect(resolveMediaImageSource(media.url, 100)).toBe(`/media/${media.key}`);
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
    expect(second.key).toBe(`default/${second.id}/1/original`);
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
    expect(prefix).toMatch(/^default\/[0-9a-f-]+\/$/);

    const failedMediaId = prefix.split("/")[1];
    await expect(
      db.media.count({ where: { id: failedMediaId } }),
    ).resolves.toBe(0);
    await expect(driver.deletePrefix(prefix)).resolves.toBe(0);
  });

  it("reports an unreadable source without creating a row", async () => {
    const key = `uploads/${randomUUID()}`;

    const error = await createMedia(key).catch((reason) => reason);

    expect(error).toBeInstanceOf(MediaProcessingError);
    await expect(db.media.count({ where: { key: null } })).resolves.toBe(0);
  });

  it.each([
    [MediaType.FILE, "application/pdf"],
    [MediaType.AUDIO, "audio/mpeg"],
    [MediaType.VIDEO, "video/mp4"],
  ])(
    "stores a %s uploaded through the transport under its own revision",
    async (type, mimeType) => {
      const bytes = new Uint8Array([4, 5, 6, 7, 8, 9]);
      const sourceKey = `tmp/${randomUUID()}`;
      await driver.put(sourceKey, bytes, mimeType);

      const media = await createMediaFromUpload({
        driver,
        storageDriver: "local",
        storeUploadedObject: true,
        source: {
          key: sourceKey,
          url: `/media/${sourceKey}`,
          name: "Download",
          type,
          mimeType,
          size: bytes.byteLength,
        },
      });
      mediaIds.push(media.id);

      expect(media).toMatchObject({
        key: `default/${media.id}/1/original`,
        url: `/media/default/${media.id}/1/original`,
        type,
        mimeType,
        storageDriver: "local",
        size: bytes.byteLength,
        revision: 1,
      });
      expect(media.checksum).toBeTruthy();

      await expect(driver.get(media.key!)).resolves.toEqual(bytes);
      await expect(driver.get(sourceKey)).rejects.toBeInstanceOf(
        StorageObjectNotFoundError,
      );

      const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
      expect(row.renditions).toBeNull();
    },
  );

  it.each([MediaType.FILE, MediaType.AUDIO, MediaType.VIDEO])(
    "records a legacy %s upload through its provider address",
    async (type) => {
      const key = `uploads/${randomUUID()}`;
      const media = await createMediaFromUpload({
        driver,
        source: {
          key,
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

      // The legacy path stores the record with the absolute address it
      // arrived with and the driver an unrecorded row resolves to.
      const file = await db.storedFile.findUniqueOrThrow({
        where: { mediaId: media.id },
      });
      expect(file).toMatchObject({
        key,
        driver: "uploadthing",
        remoteUrl: "https://ghhc7ejbae.ufs.sh/f/legacy-attachment",
        contentType: "application/octet-stream",
        size: 4321,
        checksum: null,
      });
    },
  );

  it("refuses a legacy upload whose address names no storage key", async () => {
    const name = `Keyless ${randomUUID()}`;

    await expect(
      createMediaFromUpload({
        driver,
        source: {
          key: null,
          url: "https://example.test/file.pdf",
          name,
          type: MediaType.FILE,
          mimeType: "application/pdf",
          size: 1234,
        },
      }),
    ).rejects.toBeInstanceOf(MediaProcessingError);

    await expect(db.media.count({ where: { name } })).resolves.toBe(0);
  });
});

describe("replaceMediaFile", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-replace-"));
    driver = createLocalStorageDriver({ root });
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
      storageDriver: "local",
      source: sourceFor(key),
    });
    mediaIds.push(media.id);
    return media;
  }

  function replace(mediaId: string, key: string, target: StorageDriver = driver) {
    return replaceMediaFile({
      driver: target,
      storageDriver: "local",
      mediaId,
      source: { key, mimeType: "image/png" },
      // The suites never resolve a provider: an unconfigured UploadThing is
      // enough to prove cleanup follows the row.
      env: {},
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
    const { media, previousRevisionCleanup } = await replace(
      first.id,
      await putSource(replacementBytes),
    );

    expect(media.id).toBe(first.id);
    expect(media.name).toBe("Uploaded image");
    expect(media.altText).toBe("Alt text");
    expect(media.revision).toBe(2);
    expect(media.key).toBe(`default/${first.id}/2/original`);
    expect(media.size).toBe((await driver.get(media.key!)).byteLength);
    expect(previousRevisionCleanup).toBe("removed");

    const row = await db.media.findUniqueOrThrow({ where: { id: first.id } });
    const manifest = row.renditions as MediaRendition[];

    expect(row.checksum).toBe(
      createHash("sha256").update(replacementBytes).digest("hex"),
    );
    expect(manifest).toHaveLength(MEDIA_RENDITION_WIDTHS.length * 2);
    expect(
      manifest.every((rendition) => rendition.key.startsWith(`default/${first.id}/2/`)),
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

  it("keeps the stored-file record on the revision the Media now serves", async () => {
    const first = await createImageMedia(await putSource(await createPng()));
    const replacementBytes = await createPng(1200, 800, {
      r: 210,
      g: 40,
      b: 60,
    });

    const { media } = await replace(
      first.id,
      await putSource(replacementBytes),
    );

    const file = await db.storedFile.findUniqueOrThrow({
      where: { mediaId: first.id },
    });
    expect(file).toMatchObject({
      key: media.key,
      driver: "local",
      remoteUrl: null,
      contentType: "image/png",
      size: media.size,
      checksum: media.checksum,
    });
    expect(file.key).toBe(`default/${first.id}/2/original`);
  });

  it("keeps delivering the new revision through the same Media", async () => {
    const first = await createImageMedia(await putSource(await createPng()));
    const { media } = await replace(
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

      expect(replaced.media.id).toBe(first.id);
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
        if (target.startsWith(`default/${first.id}/2/`) && target.includes("/360.avif")) {
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
      driver.deletePrefix(`default/${first.id}/2/`),
    ).resolves.toBe(0);
  });

  it("rejects an unknown Media without writing anything", async () => {
    const mediaId = randomUUID();

    await expect(
      replace(mediaId, await putSource(await createPng())),
    ).rejects.toBeInstanceOf(MediaNotFoundError);

    await expect(driver.deletePrefix(`default/${mediaId}/`)).resolves.toBe(0);
  });

  it("replaces a non-image file without generating renditions", async () => {
    const oldBytes = new Uint8Array([1, 2, 3, 4]);
    const media = await createMediaFromUpload({
      driver,
      storageDriver: "local",
      source: {
        key: await putSource(oldBytes, driver, "application/pdf"),
        url: "https://ghhc7ejbae.ufs.sh/f/legacy.pdf",
        name: "Brochure.pdf",
        type: MediaType.FILE,
        mimeType: "application/pdf",
        size: 4,
        altText: null,
      },
      // The application transport records the driver that wrote the row, so
      // the replacement cleans up through local disk.
      storeUploadedObject: true,
    });
    mediaIds.push(media.id);

    const newBytes = new Uint8Array([9, 8, 7, 6, 5, 4, 3]);
    const { media: replaced } = await replaceMediaFile({
      driver,
      storageDriver: "local",
      mediaId: media.id,
      source: {
        key: await putSource(newBytes, driver, "application/pdf"),
        mimeType: "application/pdf",
      },
      env: {},
    });

    expect(replaced).toMatchObject({
      id: media.id,
      type: MediaType.FILE,
      revision: 2,
      key: `default/${media.id}/2/original`,
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

  it("reports the cleanup as skipped when the previous provider is not configured", async () => {
    const mediaId = randomUUID();
    const legacy = await db.media.create({
      data: {
        id: mediaId,
        name: "Legacy provider document",
        key: "legacy-flat-key",
        url: "https://old-provider.example/f/legacy-flat-key",
        size: 12,
        type: MediaType.FILE,
        mimeType: "application/pdf",
        revision: 1,
        storageDriver: "uploadthing",
      },
    });
    mediaIds.push(legacy.id);

    const bytes = new Uint8Array([5, 4, 3, 2, 1]);
    const { media, previousRevisionCleanup } = await replaceMediaFile({
      driver,
      storageDriver: "local",
      mediaId,
      source: {
        key: await putSource(bytes, driver, "application/pdf"),
        mimeType: "application/pdf",
      },
      // No UploadThing token: the row's driver cannot be reached, but that
      // must not block the replace.
      env: {},
    });

    expect(previousRevisionCleanup).toBe("skipped");
    expect(media).toMatchObject({
      id: mediaId,
      revision: 2,
      storageDriver: "local",
      key: `default/${mediaId}/2/original`,
    });
    expect(new Uint8Array(await driver.get(media.key!))).toEqual(bytes);
  });

  it("reports the cleanup as skipped for a driver this build does not know", async () => {
    const mediaId = randomUUID();
    const unknown = await db.media.create({
      data: {
        id: mediaId,
        name: "Future driver document",
        key: "s3/future-original",
        url: "https://unsupported.example/future-original",
        size: 12,
        type: MediaType.FILE,
        mimeType: "application/pdf",
        revision: 1,
        storageDriver: "s3",
      },
    });
    mediaIds.push(unknown.id);

    const bytes = new Uint8Array([6, 6, 6]);
    const { media, previousRevisionCleanup } = await replaceMediaFile({
      driver,
      storageDriver: "local",
      mediaId,
      source: {
        key: await putSource(bytes, driver, "application/pdf"),
        mimeType: "application/pdf",
      },
      env: {},
    });

    // An unknown name is not a reason to guess at a driver: the previous
    // object stays put and the replace still succeeds.
    expect(previousRevisionCleanup).toBe("skipped");
    expect(media).toMatchObject({
      id: mediaId,
      revision: 2,
      storageDriver: "local",
    });
    expect(new Uint8Array(await driver.get(media.key!))).toEqual(bytes);
  });
});
