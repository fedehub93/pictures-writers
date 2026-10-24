import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType, ProductType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { resolveMediaImageSource } from "@/modules/media/lib/image-loader";
import type { MediaRendition } from "@/modules/media/types";

import {
  archiveMedia,
  createMediaFromUpload,
  deleteMediaPermanently,
  MediaInUseError,
  MediaNotArchivedError,
  MediaNotFoundError,
  restoreMedia,
} from "../media-service";
import { countMediaReferences, countMediaReferencesFor } from "../media-usage";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";

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
    driver = createLocalStorageDriver({ root, publicBaseUrl: "/media" });
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
      source: {
        key,
        url: `https://ghhc7ejbae.ufs.sh/f/${key}`,
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
      deleteMediaPermanently({ driver, mediaId: media.id }),
    ).rejects.toBeInstanceOf(MediaNotArchivedError);

    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.not.toBeNull();
    await expect(driver.get(media.key!)).resolves.toBeDefined();
  });

  it("removes an archived Media row and every object under its prefix", async () => {
    const { media } = await createImageMedia();
    await archiveMedia(media.id);

    await deleteMediaPermanently({ driver, mediaId: media.id });

    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.toBeNull();
    await expect(driver.deletePrefix(`${media.id}/`)).resolves.toBe(0);
  });

  it("removes a legacy original stored outside the Media prefix", async () => {
    const key = `uploads/${randomUUID()}`;
    await driver.put(key, new Uint8Array([1, 2, 3]), "application/pdf");

    const media = await createMediaFromUpload({
      driver,
      source: {
        key,
        url: `https://ghhc7ejbae.ufs.sh/f/${key}`,
        name: "Legacy attachment",
        type: MediaType.FILE,
        mimeType: "application/pdf",
        size: 3,
      },
    });
    mediaIds.push(media.id);
    await archiveMedia(media.id);

    await deleteMediaPermanently({ driver, mediaId: media.id });

    await expect(
      db.media.findUnique({ where: { id: media.id } }),
    ).resolves.toBeNull();
    await expect(driver.get(key)).rejects.toBeDefined();
  });

  it("refuses permanent deletion when content still references the Media", async () => {
    const { media } = await createImageMedia();
    const post = await createPostVersion(media.id);
    await archiveMedia(media.id);

    const error = await deleteMediaPermanently({
      driver,
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
      deleteMediaPermanently({ driver, mediaId }),
    ).rejects.toBeInstanceOf(MediaNotFoundError);
  });

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
      source: {
        key: otherKey,
        url: `https://ghhc7ejbae.ufs.sh/f/${otherKey}`,
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
