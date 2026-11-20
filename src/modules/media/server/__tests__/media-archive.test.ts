import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType, ProductType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { resolveMediaImageSource } from "@/modules/media/lib/image-loader";
import type { MediaRendition } from "@/modules/media/types";

import {
  archiveMedia,
  createMediaFromUpload,
  deleteMediaPermanently,
  deleteMediaPermanentlyBatch,
  MediaInUseError,
  MediaNotArchivedError,
  MediaNotFoundError,
  MediaProcessingError,
  restoreMedia,
} from "../media-service";
import { countMediaReferences, countMediaReferencesFor } from "../media-usage";
import { createLocalStorageDriver } from "../storage/local";
import {
  StorageObjectNotFoundError,
  type StorageDriver,
} from "../storage/types";
import { createUploadThingStorageDriver } from "../storage/uploadthing";

const uploadThing = vi.hoisted(() => ({
  fake: undefined as
    | {
        api: import("../storage/uploadthing").UploadThingApi;
        fetch: typeof fetch;
        putLegacyObject: (
          key: string,
          bytes: Uint8Array<ArrayBuffer>,
          contentType: string,
        ) => void;
      }
    | undefined,
}));

// Deletion resolves a legacy row through the provider, so the fake is injected
// at the same seam the storage contract suite uses: the UploadThing client.
vi.mock("uploadthing/server", async () => {
  const { createFakeUploadThingApi } = await import(
    "@/modules/media/server/storage/__tests__/fake-uploadthing"
  );
  const fake = createFakeUploadThingApi();
  uploadThing.fake = fake;

  return {
    UTApi: class {
      uploadFiles = fake.api.uploadFiles;
      deleteFiles = fake.api.deleteFiles;
      getFileUrls = fake.api.getFileUrls;
      listFiles = fake.api.listFiles;
    },
  };
});

function remoteDriver(): StorageDriver {
  if (!uploadThing.fake) {
    throw new Error("The fake UploadThing client was not installed.");
  }

  return createUploadThingStorageDriver(
    uploadThing.fake.api,
    uploadThing.fake.fetch,
  );
}

async function createPng(
  background = { r: 40, g: 120, b: 200 },
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: { width: 1200, height: 800, channels: 3, background },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

describe("media archive, restore and deletion", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];
  let cleanup: (() => Promise<unknown>)[];

  beforeEach(async () => {
    mediaIds = [];
    cleanup = [];
    root = await mkdtemp(path.join(tmpdir(), "media-archive-"));
    driver = createLocalStorageDriver({ root });
  });

  afterEach(async () => {
    for (const task of cleanup.reverse()) {
      await task().catch(() => undefined);
    }
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  async function createImageMedia(): Promise<{
    media: Awaited<ReturnType<typeof createMediaFromUpload>>;
    renditions: MediaRendition[];
  }> {
    const key = `uploads/${randomUUID()}`;
    await driver.put(key, await createPng(), "image/png");

    const media = await createMediaFromUpload({
      driver,
      storageDriver: "local",
      source: {
        key,
        name: "Archive image",
        type: MediaType.IMAGE,
        altText: "Alt text",
      },
    });
    mediaIds.push(media.id);

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });

    return { media, renditions: row.renditions as MediaRendition[] };
  }

  it("hides an archived Media from the library while its URL keeps working", async () => {
    const { media, renditions } = await createImageMedia();
    const avif720 = renditions.find(
      (rendition) => rendition.width === 720 && rendition.format === "avif",
    );

    expect(resolveMediaImageSource(media.url, 720)).toBe(
      await driver.url(avif720!.key),
    );

    const archived = await archiveMedia(media.id);

    expect(archived.archivedAt).not.toBeNull();
    expect(
      await db.media.count({ where: { id: media.id, archivedAt: null } }),
    ).toBe(0);
    await expect(driver.get(media.key!)).resolves.toBeDefined();
    expect(resolveMediaImageSource(archived.url, 720)).toBe(
      await driver.url(media.key!),
    );
  });

  it("restores an archived Media and delivers renditions again", async () => {
    const { media, renditions } = await createImageMedia();
    await archiveMedia(media.id);

    const restored = await restoreMedia(media.id);
    const avif720 = renditions.find(
      (rendition) => rendition.width === 720 && rendition.format === "avif",
    );

    expect(restored.archivedAt).toBeNull();
    expect(
      await db.media.count({ where: { id: media.id, archivedAt: null } }),
    ).toBe(1);
    expect(resolveMediaImageSource(restored.url, 720)).toBe(
      await driver.url(avif720!.key),
    );
  });

  it("keeps an archived Media referenceable without clearing its cover", async () => {
    const { media } = await createImageMedia();
    const post = await createPostVersion(media.id);

    const archived = await archiveMedia(media.id);

    expect(archived.archivedAt).not.toBeNull();
    const cover = await db.postVersion.findUniqueOrThrow({
      where: { id: post.id },
    });
    expect(cover.imageCoverId).toBe(media.id);
  });

  it("refuses permanent deletion of a Media that is not archived", async () => {
    const { media } = await createImageMedia();

    await expect(
      deleteMediaPermanently({
        active: { driver, name: "local" },
        mediaId: media.id,
      }),
    ).rejects.toBeInstanceOf(MediaNotArchivedError);

    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.not.toBeNull();
    await expect(driver.get(media.key!)).resolves.toBeDefined();
  });

  it("removes an archived Media row and every object under its prefix", async () => {
    const { media } = await createImageMedia();
    await archiveMedia(media.id);

    await deleteMediaPermanently({
      active: { driver, name: "local" },
      mediaId: media.id,
    });

    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.toBeNull();
    await expect(driver.deletePrefix(`${media.id}/`)).resolves.toBe(0);
  });

  it("removes a Media's objects through the driver recorded on the file", async () => {
    const { media } = await createImageMedia();
    await archiveMedia(media.id);
    const before = await db.media.findUniqueOrThrow({ where: { id: media.id } });

    // A move, or a stale mirror column, can leave the Media behind; the
    // stored-file record is what owns the bytes.
    await db.media.update({
      where: { id: media.id },
      data: {
        key: `elsewhere/${randomUUID()}/1/original`,
        storageDriver: "uploadthing",
      },
    });

    const result = await deleteMediaPermanentlyBatch({
      active: { driver, name: "local" },
      mediaIds: [media.id],
      env: {},
    });

    expect(result).toEqual({
      deleted: 1,
      cleanup: [{ mediaId: media.id, status: "removed" }],
    });
    await expect(driver.get(before.key!)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
    await expect(
      db.storedFile.findUnique({ where: { mediaId: media.id } }),
    ).resolves.toBeNull();
  });

  it("removes the renditions of a legacy row whose original is a provider file key", async () => {
    const mediaId = randomUUID();
    const originalKey = `legacy-${randomUUID()}`;
    const renditionKey = `${mediaId}/1/320.avif`;
    const originalBytes = new Uint8Array([1, 2, 3]);
    const renditionBytes = new Uint8Array([4, 5, 6]);

    uploadThing.fake!.putLegacyObject(originalKey, originalBytes, "image/png");
    // A rendition written by the app is addressed by its customId; the
    // pre-seam original has none, so only its exact key can find it.
    await remoteDriver().put(renditionKey, renditionBytes, "image/avif");

    const media = await db.media.create({
      data: {
        id: mediaId,
        name: "Legacy image with renditions",
        key: originalKey,
        url: `https://fake-app.ufs.sh/f/${originalKey}`,
        size: originalBytes.byteLength,
        type: MediaType.IMAGE,
        mimeType: "image/png",
        revision: 1,
        archivedAt: new Date(),
        renditions: [
          {
            key: renditionKey,
            width: 320,
            height: 200,
            bytes: renditionBytes.byteLength,
            format: "avif",
          },
        ],
        storedFile: {
          create: {
            key: originalKey,
            driver: "uploadthing",
            remoteUrl: `https://fake-app.ufs.sh/f/${originalKey}`,
            contentType: "image/png",
            size: originalBytes.byteLength,
          },
        },
      },
    });
    mediaIds.push(media.id);

    const result = await deleteMediaPermanentlyBatch({
      active: { driver, name: "local" },
      mediaIds: [media.id],
      env: { UPLOADTHING_TOKEN: "fake-token" },
    });

    expect(result.cleanup).toEqual([{ mediaId, status: "removed" }]);
    const remote = remoteDriver();
    await expect(remote.get(originalKey)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
    await expect(remote.get(renditionKey)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("removes a legacy original by its provider file key", async () => {
    const key = `legacy-${randomUUID()}`;
    const media = await createLegacyMedia(key);

    const result = await deleteMediaPermanentlyBatch({
      active: { driver, name: "local" },
      mediaIds: [media.id],
      env: { UPLOADTHING_TOKEN: "fake-token" },
    });

    expect(result.deleted).toBe(1);
    expect(result.cleanup).toEqual([{ mediaId: media.id, status: "removed" }]);
    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.toBeNull();
    await expect(remoteDriver().get(key)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("refuses permanent deletion when content still references the Media", async () => {
    const { media } = await createImageMedia();
    const post = await createPostVersion(media.id);
    await archiveMedia(media.id);

    const error = await deleteMediaPermanently({
      active: { driver, name: "local" },
      mediaId: media.id,
    }).catch((reason) => reason);

    expect(error).toBeInstanceOf(MediaInUseError);
    expect((error as MediaInUseError).usage).toBe(1);

    const cover = await db.postVersion.findUniqueOrThrow({
      where: { id: post.id },
    });
    expect(cover.imageCoverId).toBe(media.id);
    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.not.toBeNull();
  });

  it("counts every relational reference type", async () => {
    const { media } = await createImageMedia();
    const references = await createEveryReference(media.id);

    await expect(countMediaReferences(media.id)).resolves.toBe(7);

    const counts = await countMediaReferencesFor([
      media.id,
      references.otherMediaId,
    ]);

    expect(counts.get(media.id)).toBe(7);
    expect(counts.get(references.otherMediaId)).toBe(0);
  });

  it("refuses an unknown Media", async () => {
    const mediaId = randomUUID();

    await expect(archiveMedia(mediaId)).rejects.toBeInstanceOf(
      MediaNotFoundError,
    );
    await expect(restoreMedia(mediaId)).rejects.toBeInstanceOf(
      MediaNotFoundError,
    );
    await expect(
      deleteMediaPermanently({
        active: { driver, name: "local" },
        mediaId,
      }),
    ).rejects.toBeInstanceOf(MediaNotFoundError);
  });

  it("deletes a mixed selection through the driver recorded on each row", async () => {
    const { media: local } = await createImageMedia();
    await archiveMedia(local.id);

    // A revision left behind by an interrupted replace must not survive the
    // Media, which is why the whole installation directory is the unit.
    const staleKey = `default/${local.id}/2/original`;
    await driver.put(staleKey, new Uint8Array([9, 9, 9]), "image/png");

    const flat = await createLegacyMedia(`legacy-flat-${randomUUID()}`);
    const namespaced = await createLegacyMedia(
      `${randomUUID()}/1/original`,
    );

    const result = await deleteMediaPermanentlyBatch({
      active: { driver, name: "local" },
      mediaIds: [local.id, flat.id, namespaced.id],
      env: { UPLOADTHING_TOKEN: "fake-token" },
    });

    expect(result.deleted).toBe(3);
    expect(
      new Map(result.cleanup.map((entry) => [entry.mediaId, entry.status])),
    ).toEqual(
      new Map([
        [local.id, "removed"],
        [flat.id, "removed"],
        [namespaced.id, "removed"],
      ]),
    );

    await expect(
      db.media.findMany({
        where: { id: { in: [local.id, flat.id, namespaced.id] } },
      }),
    ).resolves.toEqual([]);

    // Every byte under the local Media's prefix is gone...
    await expect(driver.deletePrefix(`default/${local.id}/`)).resolves.toBe(0);
    await expect(driver.get(local.key!)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
    await expect(driver.get(staleKey)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );

    // ...and both legacy key shapes were removed from the provider.
    const remote = remoteDriver();
    for (const legacy of [flat, namespaced]) {
      await expect(remote.get(legacy.key!)).rejects.toBeInstanceOf(
        StorageObjectNotFoundError,
      );
    }
  });

  it("deletes the rows and reports the object when the legacy provider is not configured", async () => {
    const { media: local } = await createImageMedia();
    await archiveMedia(local.id);
    const legacy = await createLegacyMedia(`legacy-${randomUUID()}`);

    const result = await deleteMediaPermanentlyBatch({
      active: { driver, name: "local" },
      mediaIds: [local.id, legacy.id],
      // No UploadThing token: the row's driver cannot be reached here.
      env: {},
    });

    expect(result.deleted).toBe(2);
    expect(
      result.cleanup.find((entry) => entry.mediaId === local.id),
    ).toMatchObject({ status: "removed" });
    expect(
      result.cleanup.find((entry) => entry.mediaId === legacy.id),
    ).toMatchObject({
      status: "skipped",
      reason: expect.stringContaining("not configured"),
    });

    await expect(
      db.media.findMany({ where: { id: { in: [local.id, legacy.id] } } }),
    ).resolves.toEqual([]);
    await expect(driver.deletePrefix(`default/${local.id}/`)).resolves.toBe(0);

    // The provider object stays behind on purpose, and the report says so.
    await expect(remoteDriver().get(legacy.key!)).resolves.toBeDefined();
  });

  it("skips a Media whose recorded driver is unknown without aborting the batch", async () => {
    const { media: local } = await createImageMedia();
    await archiveMedia(local.id);

    const unknown = await db.media.create({
      data: {
        name: "Future driver document",
        key: `s3/${randomUUID()}/1/original`,
        url: `https://unsupported.example/${randomUUID()}`,
        size: 3,
        type: MediaType.FILE,
        mimeType: "application/pdf",
        revision: 1,
        storageDriver: "s3",
        archivedAt: new Date(),
      },
    });
    mediaIds.push(unknown.id);

    const result = await deleteMediaPermanentlyBatch({
      active: { driver, name: "local" },
      mediaIds: [local.id, unknown.id],
      env: {},
    });

    expect(result.deleted).toBe(2);
    expect(
      result.cleanup.find((entry) => entry.mediaId === local.id),
    ).toMatchObject({ status: "removed" });
    expect(
      result.cleanup.find((entry) => entry.mediaId === unknown.id),
    ).toMatchObject({
      status: "skipped",
      reason: expect.stringContaining('unknown storage driver "s3"'),
    });
    await expect(
      db.media.findMany({ where: { id: { in: [local.id, unknown.id] } } }),
    ).resolves.toEqual([]);
    await expect(driver.deletePrefix(`default/${local.id}/`)).resolves.toBe(0);
  });

  it("deletes the rows it finished and leaves the rest when an object cannot be removed", async () => {
    const finished = await createLocalDocument();
    const failing = await createLocalDocument();
    const failure = `default/${failing.id}/`;

    const failingDriver: StorageDriver = {
      ...driver,
      deletePrefix: async (prefix) => {
        if (prefix === failure) throw new Error("simulated provider failure");
        return driver.deletePrefix(prefix);
      },
    };

    const error = await deleteMediaPermanentlyBatch({
      active: { driver: failingDriver, name: "local" },
      mediaIds: [finished.id, failing.id],
      env: {},
    }).catch((reason) => reason);

    expect(error).toBeInstanceOf(MediaProcessingError);
    expect((error as Error).message).toContain("1 Media was deleted");

    // The first row was cleaned and deleted; the second keeps its row and its
    // bytes, so the library never points at an object that is already gone.
    await expect(
      db.media.findUnique({ where: { id: finished.id } }),
    ).resolves.toBeNull();
    await expect(
      db.media.findUnique({ where: { id: failing.id } }),
    ).resolves.not.toBeNull();
    await expect(driver.get(failing.key!)).resolves.toBeDefined();
  });

  async function createLocalDocument() {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const bytes = new Uint8Array([4, 5, 6]);
    await driver.put(key, bytes, "application/pdf");

    const media = await db.media.create({
      data: {
        id,
        name: "Local document",
        key,
        url: `/media/${key}`,
        size: bytes.byteLength,
        type: MediaType.FILE,
        mimeType: "application/pdf",
        revision: 1,
        storageDriver: "local",
        archivedAt: new Date(),
        storedFile: {
          create: {
            key,
            driver: "local",
            contentType: "application/pdf",
            size: bytes.byteLength,
          },
        },
      },
    });
    mediaIds.push(media.id);

    return media;
  }

  async function createLegacyMedia(
    key: string,
    bytes = new Uint8Array([1, 2, 3]),
  ) {
    uploadThing.fake!.putLegacyObject(key, bytes, "application/pdf");

    const media = await db.media.create({
      data: {
        name: "Legacy provider document",
        key,
        url: `https://fake-app.ufs.sh/f/${encodeURIComponent(key)}`,
        size: bytes.byteLength,
        type: MediaType.FILE,
        mimeType: "application/pdf",
        revision: 1,
        storageDriver: null,
        archivedAt: new Date(),
        // The one-time location backfill records a pre-seam row as an
        // UploadThing file with the absolute address it still carries.
        storedFile: {
          create: {
            key,
            driver: "uploadthing",
            remoteUrl: `https://fake-app.ufs.sh/f/${encodeURIComponent(key)}`,
            contentType: "application/pdf",
            size: bytes.byteLength,
          },
        },
      },
    });
    mediaIds.push(media.id);

    return media;
  }

  async function createPostVersion(mediaId: string) {
    const root = await db.postRoot.create({
      data: { slug: `post-${randomUUID()}` },
    });
    cleanup.push(() => db.postRoot.delete({ where: { id: root.id } }));

    const post = await db.postVersion.create({
      data: {
        title: "Post",
        version: 1,
        rootId: root.id,
        imageCoverId: mediaId,
      },
    });
    cleanup.push(() => db.postVersion.delete({ where: { id: post.id } }));

    return post;
  }

  async function createEveryReference(mediaId: string) {
    await createPostVersion(mediaId);

    const pageRoot = await db.pageRoot.create({
      data: { slug: `page-${randomUUID()}` },
    });
    cleanup.push(() => db.pageRoot.delete({ where: { id: pageRoot.id } }));
    const page = await db.pageVersion.create({
      data: {
        title: "Page",
        version: 1,
        rootId: pageRoot.id,
        imageCoverId: mediaId,
      },
    });
    cleanup.push(() => db.pageVersion.delete({ where: { id: page.id } }));

    const productRoot = await db.productRoot.create({
      data: { slug: `product-${randomUUID()}`, type: ProductType.EBOOK },
    });
    cleanup.push(() => db.productRoot.delete({ where: { id: productRoot.id } }));
    const product = await db.productVersion.create({
      data: {
        title: "Product",
        version: 1,
        rootId: productRoot.id,
        imageCoverId: mediaId,
      },
    });
    cleanup.push(() =>
      db.productVersion.delete({ where: { id: product.id } }),
    );
    await db.productGallery.create({
      data: { productId: product.id, mediaId, sort: 1 },
    });

    const seo = await db.seo.create({
      data: { title: "Seo", version: 1, ogTwitterImageId: mediaId },
    });
    cleanup.push(() => db.seo.delete({ where: { id: seo.id } }));

    const user = await db.user.create({
      data: { profileImageId: mediaId },
    });
    cleanup.push(() => db.user.delete({ where: { id: user.id } }));

    const impression = await db.impression.create({
      data: { title: "Impression", email: "reader@example.com", fileId: mediaId },
    });
    cleanup.push(() =>
      db.impression.delete({ where: { id: impression.id } }),
    );

    const otherKey = `uploads/${randomUUID()}`;
    await driver.put(otherKey, await createPng({ r: 200, g: 40, b: 90 }), "image/png");
    const other = await createMediaFromUpload({
      driver,
      storageDriver: "local",
      source: {
        key: otherKey,
        name: "Other image",
        type: MediaType.IMAGE,
      },
    });
    mediaIds.push(other.id);

    return {
      otherMediaId: other.id,
    };
  }
});
