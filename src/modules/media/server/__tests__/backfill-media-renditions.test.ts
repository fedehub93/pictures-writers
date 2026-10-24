import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { MEDIA_RENDITION_WIDTHS } from "@/modules/media/lib/image-ladder.mjs";
import { resolveMediaImageSource } from "@/modules/media/lib/image-loader";
import type { MediaRendition } from "@/modules/media/types";

import { backfillMediaRenditions } from "../backfill-media-renditions";
import { archiveMedia, restoreMedia } from "../media-service";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";

async function createPng(
  width = 1000,
  height = 600,
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 30, g: 120, b: 200 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

async function listFiles(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, entryPath)));
    } else {
      files.push(path.relative(root, entryPath).split(path.sep).join("/"));
    }
  }

  return files.sort();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("backfillMediaRenditions", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  async function createMedia(data: {
    key: string | null;
    url: string;
    type?: MediaType;
    renditions?: MediaRendition[] | null;
  }) {
    const media = await db.media.create({
      data: {
        name: `Backfill renditions ${randomUUID()}`,
        key: data.key,
        url: data.url,
        type: data.type ?? MediaType.IMAGE,
        renditions: data.renditions
          ? (data.renditions as PrismaJson.MediaRenditions)
          : null,
      },
    });

    mediaIds.push(media.id);
    return media;
  }

  async function createLegacyImage(bytes: Uint8Array<ArrayBuffer>) {
    const legacyKey = `legacy-${randomUUID()}`;
    await driver.put(legacyKey, bytes, "image/png");

    const media = await createMedia({ key: null, url: `/assets/${legacyKey}` });

    return { media, legacyKey };
  }

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-renditions-"));
    driver = createLocalStorageDriver({ root, publicBaseUrl: "/media" });
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  it("generates the full ladder for a legacy image and delivers it through the loader", async () => {
    const bytes = await createPng();
    const { media } = await createLegacyImage(bytes);

    const pending = await db.media.findUniqueOrThrow({
      where: { id: media.id },
    });
    expect(pending.renditions).toBeNull();
    expect(resolveMediaImageSource(pending.url, 720)).not.toContain("/media/");

    const report = await backfillMediaRenditions({ driver, mediaIds });

    expect(report).toMatchObject({
      scanned: 1,
      processed: 1,
      skipped: 0,
      failed: [],
      dryRun: false,
    });

    const row = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    const manifest = row.renditions as MediaRendition[];

    expect(row.key).toBe(`${media.id}/1/original`);
    expect(row.mimeType).toBe("image/png");
    expect(row.metadata).toMatchObject({ width: 1000, height: 600 });
    expect(manifest).toHaveLength(MEDIA_RENDITION_WIDTHS.length * 2);
    expect(
      manifest.every((rendition) =>
        rendition.key.startsWith(`${media.id}/1/`),
      ),
    ).toBe(true);

    const avif720 = manifest.find(
      (rendition) => rendition.width === 720 && rendition.format === "avif",
    );
    const avif480 = manifest.find(
      (rendition) => rendition.width === 480 && rendition.format === "avif",
    );

    expect(avif720).toBeDefined();
    expect(avif480).toBeDefined();
    expect(resolveMediaImageSource(row.url, 720)).toBe(
      await driver.url(avif720!.key),
    );
    expect(resolveMediaImageSource(row.url, 800)).toBe(
      await driver.url(avif720!.key),
    );
    expect(resolveMediaImageSource(row.url, 500)).toBe(
      await driver.url(avif480!.key),
    );

    for (const rendition of manifest) {
      await expect(driver.get(rendition.key)).resolves.toBeDefined();
    }
    await expect(driver.get(row.key!)).resolves.toBeDefined();
  });

  it("keeps the legacy source reachable for content that stored its absolute URL", async () => {
    const { media, legacyKey } = await createLegacyImage(await createPng());

    await backfillMediaRenditions({ driver, mediaIds });

    await expect(driver.get(legacyKey)).resolves.toBeDefined();
    await expect(
      db.media.findUniqueOrThrow({ where: { id: media.id } }),
    ).resolves.toMatchObject({ key: `${media.id}/1/original` });
  });

  it("can be run twice without creating new objects or touching processed rows", async () => {
    await createLegacyImage(await createPng());

    const first = await backfillMediaRenditions({ driver, mediaIds });
    const storedAfterFirst = await listFiles(root);

    const media = await db.media.findFirstOrThrow({
      where: { id: { in: mediaIds } },
    });

    const report = await backfillMediaRenditions({ driver, mediaIds });
    const mediaAfterSecond = await db.media.findUniqueOrThrow({
      where: { id: media.id },
    });

    expect(first).toMatchObject({ scanned: 1, processed: 1, skipped: 0 });
    expect(report).toMatchObject({
      scanned: 1,
      processed: 0,
      skipped: 1,
      failed: [],
    });
    expect(await listFiles(root)).toEqual(storedAfterFirst);
    expect(mediaAfterSecond.renditions).toEqual(media.renditions);
    expect(mediaAfterSecond.updatedAt.getTime()).toBe(
      media.updatedAt.getTime(),
    );
  });

  it("lists pending work in dry-run without writing storage or the database", async () => {
    const { media } = await createLegacyImage(await createPng());
    const before = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    const storedBefore = await listFiles(root);

    const report = await backfillMediaRenditions({
      driver,
      mediaIds,
      dryRun: true,
    });

    expect(report).toMatchObject({
      scanned: 1,
      processed: 0,
      skipped: 0,
      failed: [],
      dryRun: true,
    });
    expect(report.pending).toEqual([
      { mediaId: media.id, name: media.name },
    ]);

    const after = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(after.key).toBe(before.key);
    expect(after.url).toBe(before.url);
    expect(after.renditions).toBeNull();
    expect(await listFiles(root)).toEqual(storedBefore);
  });

  it("reports an unreachable source and keeps processing the rest", async () => {
    const { media: healthy } = await createLegacyImage(await createPng());
    const broken = await createMedia({
      key: `missing-${randomUUID()}`,
      url: "https://example.test/missing.png",
    });

    const report = await backfillMediaRenditions({ driver, mediaIds });

    expect(report.processed).toBe(1);
    expect(report.pending).toHaveLength(
      report.processed + report.failed.length,
    );
    expect(report.failed).toEqual([
      {
        mediaId: broken.id,
        name: broken.name,
        reason: "source not found in storage",
      },
    ]);
    await expect(
      db.media.findUniqueOrThrow({ where: { id: healthy.id } }),
    ).resolves.toMatchObject({ key: `${healthy.id}/1/original` });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: broken.id } }),
    ).resolves.toMatchObject({ renditions: null });
  });

  it("does not create storage objects when the source cannot be decoded", async () => {
    const brokenKey = `broken-${randomUUID()}`;
    await driver.put(brokenKey, new Uint8Array([1, 2, 3, 4]), "image/png");
    const media = await createMedia({
      key: brokenKey,
      url: `/assets/${brokenKey}`,
    });

    const report = await backfillMediaRenditions({ driver, mediaIds });

    expect(report.processed).toBe(0);
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0]).toMatchObject({ mediaId: media.id });
    expect(await listFiles(root)).toEqual([brokenKey]);
    await expect(
      db.media.findUniqueOrThrow({ where: { id: media.id } }),
    ).resolves.toMatchObject({ renditions: null, key: brokenKey });
  });

  it("keeps an archived image on its original until it is restored", async () => {
    const { media } = await createLegacyImage(await createPng());
    await archiveMedia(media.id);

    await backfillMediaRenditions({ driver, mediaIds });

    const archived = await db.media.findUniqueOrThrow({
      where: { id: media.id },
    });
    const manifest = archived.renditions as MediaRendition[];
    const originalUrl = await driver.url(archived.key!);

    expect(resolveMediaImageSource(archived.url, 720)).toBe(originalUrl);

    await restoreMedia(media.id);
    const restored = await db.media.findUniqueOrThrow({
      where: { id: media.id },
    });
    const avif720 = manifest.find(
      (rendition) => rendition.width === 720 && rendition.format === "avif",
    );

    expect(resolveMediaImageSource(restored.url, 720)).toBe(
      await driver.url(avif720!.key),
    );
  });

  it("bounds how many sources are read at once", async () => {
    for (let index = 0; index < 5; index += 1) {
      await createLegacyImage(await createPng());
    }

    let active = 0;
    let peak = 0;
    const slowDriver: StorageDriver = {
      ...driver,
      get: async (key) => {
        active += 1;
        peak = Math.max(peak, active);
        try {
          await delay(25);
          return await driver.get(key);
        } finally {
          active -= 1;
        }
      },
    };

    const report = await backfillMediaRenditions({
      driver: slowDriver,
      mediaIds,
      concurrency: 2,
    });

    expect(report.processed).toBe(5);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("ignores non-image media", async () => {
    const key = `uploads/${randomUUID()}`;
    await driver.put(key, new Uint8Array([1, 2, 3]), "application/pdf");
    const file = await createMedia({
      key,
      url: "https://example.test/brochure.pdf",
      type: MediaType.FILE,
    });

    const report = await backfillMediaRenditions({ driver, mediaIds });

    expect(report.scanned).toBe(0);
    await expect(
      db.media.findUniqueOrThrow({ where: { id: file.id } }),
    ).resolves.toMatchObject({ renditions: null, key });
  });
});
