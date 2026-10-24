import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { backfillMediaMetadata } from "../backfill-media-metadata";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";

async function createPng(): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width: 80,
      height: 40,
      channels: 3,
      background: { r: 20, g: 160, b: 80 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

describe("backfillMediaMetadata", () => {
  let root: string;
  let driver: StorageDriver;
  let mediaIds: string[];

  async function createMedia(
    data: {
      type?: MediaType;
      key: string | null;
      url?: string;
      metadata?: PrismaJson.MediaMetadata;
      mimeType?: string;
      size?: number;
      checksum?: string;
    },
  ) {
    const media = await db.media.create({
      data: {
        name: `Backfill ${randomUUID()}`,
        url: data.url ?? `https://example.test/${randomUUID()}.png`,
        key: data.key,
        type: data.type ?? MediaType.IMAGE,
        metadata: data.metadata ?? null,
        mimeType: data.mimeType ?? null,
        size: data.size ?? null,
        checksum: data.checksum ?? null,
      },
    });

    mediaIds.push(media.id);
    return media;
  }

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-backfill-"));
    driver = createLocalStorageDriver({
      root,
      publicBaseUrl: "/media",
    });
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  it("fills MIME type, size, dimensions, checksum and blur placeholder", async () => {
    const bytes = await createPng();
    const key = `media-${randomUUID()}/1/original`;
    await driver.put(key, bytes, "image/png");

    const media = await createMedia({ key, size: bytes.byteLength });

    const report = await backfillMediaMetadata({ driver, mediaIds });

    expect(report).toMatchObject({
      scanned: 1,
      updated: 1,
      skipped: 0,
      failed: [],
      dryRun: false,
    });

    const updated = await db.media.findUniqueOrThrow({
      where: { id: media.id },
    });

    expect(updated.mimeType).toBe("image/png");
    expect(updated.size).toBe(bytes.byteLength);
    expect(updated.checksum).toBe(
      createHash("sha256").update(bytes).digest("hex"),
    );
    expect(updated.metadata).toMatchObject({
      width: 80,
      height: 40,
    });
    expect(
      (updated.metadata as PrismaJson.MediaMetadata)?.blurDataURL,
    ).toMatch(/^data:image\/webp;base64,/);
  });

  it("changes nothing when run again", async () => {
    const bytes = await createPng();
    const key = `media-${randomUUID()}/1/original`;
    await driver.put(key, bytes, "image/png");
    const media = await createMedia({ key });

    await backfillMediaMetadata({ driver, mediaIds });
    const first = await db.media.findUniqueOrThrow({ where: { id: media.id } });

    const report = await backfillMediaMetadata({ driver, mediaIds });
    const second = await db.media.findUniqueOrThrow({ where: { id: media.id } });

    expect(report).toMatchObject({ scanned: 1, updated: 0, skipped: 1 });
    expect(second.checksum).toBe(first.checksum);
    expect(second.metadata).toEqual(first.metadata);
    expect(second.updatedAt.getTime()).toBe(first.updatedAt.getTime());
  });

  it("skips rows that already carry complete metadata", async () => {
    const media = await createMedia({
      key: `media-${randomUUID()}/1/original`,
      mimeType: "image/png",
      size: 123,
      checksum: "already-there",
      metadata: {
        width: 10,
        height: 20,
        blurDataURL: "data:image/png;base64,abc",
      },
    });

    const report = await backfillMediaMetadata({ driver, mediaIds });

    expect(report).toMatchObject({ scanned: 1, updated: 0, skipped: 1 });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: media.id } }),
    ).resolves.toMatchObject({ checksum: "already-there" });
  });

  it("reports an unreachable source and keeps processing the rest", async () => {
    const bytes = await createPng();
    const goodKey = `media-${randomUUID()}/1/original`;
    await driver.put(goodKey, bytes, "image/png");

    const healthy = await createMedia({ key: goodKey });
    const broken = await createMedia({
      key: `media-${randomUUID()}/1/original`,
    });

    const report = await backfillMediaMetadata({ driver, mediaIds });

    expect(report.updated).toBe(1);
    expect(report.failed).toEqual([
      {
        mediaId: broken.id,
        name: broken.name,
        reason: "source not found in storage",
      },
    ]);
    await expect(
      db.media.findUniqueOrThrow({ where: { id: healthy.id } }),
    ).resolves.toMatchObject({ mimeType: "image/png" });
  });

  it("reads a legacy Media through the storage key derived from its URL", async () => {
    const bytes = await createPng();
    const legacyKey = `legacy-${randomUUID()}`;
    await driver.put(legacyKey, bytes, "image/png");

    const media = await createMedia({
      key: null,
      url: `/assets/${legacyKey}`,
    });

    const report = await backfillMediaMetadata({ driver, mediaIds });

    expect(report).toMatchObject({ scanned: 1, updated: 1, failed: [] });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: media.id } }),
    ).resolves.toMatchObject({ mimeType: "image/png" });
  });

  it("reports an image whose URL does not identify a storage object", async () => {
    const media = await createMedia({ key: null });

    const report = await backfillMediaMetadata({ driver, mediaIds });

    expect(report.failed).toEqual([
      {
        mediaId: media.id,
        name: media.name,
        reason: "no readable storage key",
      },
    ]);
  });

  it("ignores non-image media", async () => {
    const bytes = await createPng();
    const key = `media-${randomUUID()}/1/original`;
    await driver.put(key, bytes, "image/png");
    const file = await createMedia({ key, type: MediaType.FILE });

    const report = await backfillMediaMetadata({ driver, mediaIds });

    expect(report.scanned).toBe(0);
    await expect(
      db.media.findUniqueOrThrow({ where: { id: file.id } }),
    ).resolves.toMatchObject({ mimeType: null, checksum: null });
  });

  it("does not write in dry-run mode", async () => {
    const bytes = await createPng();
    const key = `media-${randomUUID()}/1/original`;
    await driver.put(key, bytes, "image/png");
    const media = await createMedia({ key });

    const report = await backfillMediaMetadata({
      driver,
      mediaIds,
      dryRun: true,
    });

    expect(report).toMatchObject({
      scanned: 1,
      updated: 1,
      failed: [],
      dryRun: true,
    });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: media.id } }),
    ).resolves.toMatchObject({ mimeType: null, checksum: null });
  });
});
