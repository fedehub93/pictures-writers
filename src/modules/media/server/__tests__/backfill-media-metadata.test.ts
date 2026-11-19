import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { backfillMediaMetadata } from "../backfill-media-metadata";
import { createLocalStorageDriver } from "../storage/local";
import type {
  ResolvedStorageDriver,
  StorageEnvironment,
} from "../storage/driver";

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

// The backfill resolves a legacy row through the provider, so the fake is
// injected at the same seam the storage contract suite uses: the client.
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

function sha256(bytes: Uint8Array<ArrayBuffer>): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function createPng(
  width = 80,
  height = 40,
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

describe("backfillMediaMetadata", () => {
  let root: string;
  let active: ResolvedStorageDriver;
  let env: StorageEnvironment;
  let mediaIds: string[];

  beforeAll(() => {
    if (!uploadThing.fake) {
      throw new Error("The fake UploadThing client was not installed.");
    }
    vi.stubGlobal("fetch", uploadThing.fake.fetch);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  async function createMedia(data: {
    type?: MediaType;
    key: string | null;
    url?: string;
    storageDriver?: string | null;
    metadata?: PrismaJson.MediaMetadata;
    mimeType?: string;
    size?: number;
    checksum?: string;
  }) {
    const media = await db.media.create({
      data: {
        name: `Backfill ${randomUUID()}`,
        url: data.url ?? `https://example.test/${randomUUID()}.png`,
        key: data.key,
        type: data.type ?? MediaType.IMAGE,
        storageDriver:
          data.storageDriver === undefined ? "local" : data.storageDriver,
        metadata: data.metadata ?? null,
        mimeType: data.mimeType ?? null,
        size: data.size ?? null,
        checksum: data.checksum ?? null,
      },
    });

    mediaIds.push(media.id);
    return media;
  }

  /** A pre-seam row: a flat provider key, an absolute URL and no recorded driver. */
  async function createLegacyRemoteImage(bytes: Uint8Array<ArrayBuffer>) {
    const legacyKey = `legacy-${randomUUID()}`;
    uploadThing.fake!.putLegacyObject(legacyKey, bytes, "image/png");

    const media = await createMedia({
      key: null,
      url: `/assets/${legacyKey}`,
      storageDriver: null,
    });

    return { media, legacyKey };
  }

  function run(options: Partial<Parameters<typeof backfillMediaMetadata>[0]> = {}) {
    return backfillMediaMetadata({ active, env, mediaIds, ...options });
  }

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-backfill-"));
    active = {
      name: "local",
      driver: createLocalStorageDriver({ root }),
    };
    env = { MEDIA_STORAGE_LOCAL_ROOT: root, UPLOADTHING_TOKEN: "fake-token" };
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
    await active.driver.put(key, bytes, "image/png");

    const media = await createMedia({ key, size: bytes.byteLength });

    const report = await run();

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
    expect(updated.checksum).toBe(sha256(bytes));
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
    await active.driver.put(key, bytes, "image/png");
    const media = await createMedia({ key });

    await run();
    const first = await db.media.findUniqueOrThrow({ where: { id: media.id } });

    const report = await run();
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

    const report = await run();

    expect(report).toMatchObject({ scanned: 1, updated: 0, skipped: 1 });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: media.id } }),
    ).resolves.toMatchObject({ checksum: "already-there" });
  });

  it("reports an unreachable source and keeps processing the rest", async () => {
    const bytes = await createPng();
    const goodKey = `media-${randomUUID()}/1/original`;
    await active.driver.put(goodKey, bytes, "image/png");

    const healthy = await createMedia({ key: goodKey });
    const broken = await createMedia({
      key: `media-${randomUUID()}/1/original`,
    });

    const report = await run();

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

  it("reads a mixed library through the driver recorded on each row", async () => {
    const localBytes = await createPng(80, 40);
    const localKey = `media-${randomUUID()}/1/original`;
    await active.driver.put(localKey, localBytes, "image/png");
    const local = await createMedia({ key: localKey });

    const remoteBytes = await createPng(50, 25);
    const { media: legacy } = await createLegacyRemoteImage(remoteBytes);

    const report = await run();

    expect(report).toMatchObject({
      scanned: 2,
      updated: 2,
      skipped: 0,
      failed: [],
    });

    // Different sizes prove each row was read from its own driver: a single
    // driver for the whole run could not reach both sources.
    await expect(
      db.media.findUniqueOrThrow({ where: { id: local.id } }),
    ).resolves.toMatchObject({
      checksum: sha256(localBytes),
      metadata: expect.objectContaining({ width: 80, height: 40 }),
    });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: legacy.id } }),
    ).resolves.toMatchObject({
      checksum: sha256(remoteBytes),
      metadata: expect.objectContaining({ width: 50, height: 25 }),
    });
  });

  it("reads a legacy Media through the storage key derived from its URL", async () => {
    const bytes = await createPng();
    const { media } = await createLegacyRemoteImage(bytes);

    const report = await run();

    expect(report).toMatchObject({ scanned: 1, updated: 1, failed: [] });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: media.id } }),
    ).resolves.toMatchObject({
      mimeType: "image/png",
      checksum: sha256(bytes),
    });
  });

  it("reports a row whose recorded driver is unavailable and keeps the run going", async () => {
    // No provider credential here, so neither the unconfigured driver nor the
    // unknown name can be reached, while the local row still is.
    env = { MEDIA_STORAGE_LOCAL_ROOT: root };

    const bytes = await createPng();
    const localKey = `media-${randomUUID()}/1/original`;
    await active.driver.put(localKey, bytes, "image/png");
    const healthy = await createMedia({ key: localKey });

    const unconfigured = await createMedia({
      key: `media-${randomUUID()}/1/original`,
      url: `https://example.test/${randomUUID()}.png`,
      storageDriver: "uploadthing",
    });
    const unknown = await createMedia({
      key: `media-${randomUUID()}/1/original`,
      url: `https://example.test/${randomUUID()}.png`,
      storageDriver: "s3",
    });

    const report = await run();

    expect(report.updated).toBe(1);
    expect(report.failed).toEqual(
      expect.arrayContaining([
        {
          mediaId: unconfigured.id,
          name: unconfigured.name,
          reason: 'storage driver "uploadthing" is not configured',
        },
        {
          mediaId: unknown.id,
          name: unknown.name,
          reason: 'unknown storage driver "s3"',
        },
      ]),
    );
    await expect(
      db.media.findUniqueOrThrow({ where: { id: healthy.id } }),
    ).resolves.toMatchObject({ checksum: sha256(bytes) });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: unconfigured.id } }),
    ).resolves.toMatchObject({ mimeType: null, checksum: null });
  });

  it("reports an image whose URL does not identify a storage object", async () => {
    const media = await createMedia({ key: null });

    const report = await run();

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
    await active.driver.put(key, bytes, "image/png");
    const file = await createMedia({ key, type: MediaType.FILE });

    const report = await run();

    expect(report.scanned).toBe(0);
    await expect(
      db.media.findUniqueOrThrow({ where: { id: file.id } }),
    ).resolves.toMatchObject({ mimeType: null, checksum: null });
  });

  it("does not write in dry-run mode", async () => {
    const bytes = await createPng();
    const key = `media-${randomUUID()}/1/original`;
    await active.driver.put(key, bytes, "image/png");
    const media = await createMedia({ key });

    const report = await run({ dryRun: true });

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

  it("dry-runs a mixed library without writing either half", async () => {
    const localBytes = await createPng();
    const localKey = `media-${randomUUID()}/1/original`;
    await active.driver.put(localKey, localBytes, "image/png");
    const local = await createMedia({ key: localKey });
    const { media: legacy } = await createLegacyRemoteImage(await createPng());

    const report = await run({ dryRun: true });

    expect(report).toMatchObject({
      scanned: 2,
      updated: 2,
      failed: [],
      dryRun: true,
    });
    for (const id of [local.id, legacy.id]) {
      await expect(
        db.media.findUniqueOrThrow({ where: { id } }),
      ).resolves.toMatchObject({ mimeType: null, checksum: null });
    }
  });
});
