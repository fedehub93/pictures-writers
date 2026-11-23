import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { MEDIA_RENDITION_WIDTHS } from "@/modules/media/lib/image-ladder.mjs";
import { resolveMediaImageSource } from "@/modules/media/lib/image-loader";
import { mediaDeliveryAddress } from "@/modules/media/lib/media-address";
import {
  MEDIA_MANIFEST_PARAM,
  decodeMediaManifest,
} from "@/modules/media/lib/manifest";
import { storedFilePath } from "@/modules/media/lib/file-path";
import type { MediaRendition } from "@/modules/media/types";

import { backfillMediaRenditions } from "../backfill-media-renditions";
import { archiveMedia, restoreMedia } from "../media-service";
import type {
  ResolvedStorageDriver,
  StorageEnvironment,
} from "../storage/driver";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";
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
  let localDriver: StorageDriver;
  let remoteDriver: StorageDriver;
  let active: ResolvedStorageDriver;
  let env: StorageEnvironment;
  let mediaIds: string[];

  async function createMedia(data: {
    id?: string;
    /** The record's key. Kept as `key` for the pre-contraction callers. */
    key?: string | null;
    /** The record's provider address when absolute; a canonical one records none. */
    url?: string;
    type?: MediaType;
    /** The record's driver, unless `record` names one. */
    storageDriver?: string | null;
    renditions?: MediaRendition[] | null;
    /**
     * The stored-file record. The aliases above fill it when this is omitted;
     * `null` creates a Media with none.
     */
    record?: {
      key: string;
      driver: string;
      remoteUrl?: string | null;
      contentType?: string | null;
      size?: number | null;
      checksum?: string | null;
    } | null;
  }) {
    const fromAliases = data.key
      ? {
          key: data.key,
          driver: data.storageDriver ?? "local",
          remoteUrl: data.url && data.url.includes("://") ? data.url : null,
        }
      : null;
    const record = data.record === null ? null : (data.record ?? fromAliases);

    const media = await db.media.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        name: `Backfill renditions ${randomUUID()}`,
        type: data.type ?? MediaType.IMAGE,
        renditions: data.renditions
          ? (data.renditions as PrismaJson.MediaRenditions)
          : null,
        ...(record ? { storedFile: { create: record } } : {}),
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
      record: {
        key: legacyKey,
        driver: "uploadthing",
        remoteUrl: `https://fake-app.ufs.sh/f/${encodeURIComponent(legacyKey)}`,
        contentType: "image/png",
        size: bytes.byteLength,
      },
    });

    return { media, legacyKey };
  }

  /** A row the local driver wrote: namespaced key, relative address. */
  async function createLocalImage(bytes: Uint8Array<ArrayBuffer>) {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    await localDriver.put(key, bytes, "image/png");

    const media = await createMedia({
      id,
      key,
      url: storedFilePath("MEDIA", key),
      storageDriver: "local",
      record: {
        key,
        driver: "local",
        contentType: "image/png",
        size: bytes.byteLength,
      },
    });

    return { media, key };
  }

  function run(
    options: Partial<Parameters<typeof backfillMediaRenditions>[0]> = {},
  ) {
    return backfillMediaRenditions({ active, env, mediaIds, ...options });
  }

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-renditions-"));
    localDriver = createLocalStorageDriver({ root });
    remoteDriver = createUploadThingStorageDriver(
      uploadThing.fake!.api,
      uploadThing.fake!.fetch,
    );
    active = { name: "local", driver: localDriver };
    env = { MEDIA_STORAGE_LOCAL_ROOT: root, UPLOADTHING_TOKEN: "fake-token" };
  });

  beforeAll(() => {
    if (!uploadThing.fake) {
      throw new Error("The fake UploadThing client was not installed.");
    }
    vi.stubGlobal("fetch", uploadThing.fake.fetch);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  it("generates the full ladder for a legacy image and delivers it through the loader", async () => {
    const bytes = await createPng();
    const { media, legacyKey } = await createLegacyRemoteImage(bytes);

    const pending = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      include: { storedFile: { select: { key: true } } },
    });
    expect(pending.renditions).toBeNull();
    expect(
      decodeMediaManifest(
        new URL(mediaDeliveryAddress(pending), "http://localhost").searchParams.get(
          MEDIA_MANIFEST_PARAM,
        ),
      ),
    ).toBeNull();
    expect(resolveMediaImageSource(mediaDeliveryAddress(pending), 720)).toBe(
      `/media/${legacyKey}`,
    );

    const report = await run();

    expect(report).toMatchObject({
      scanned: 1,
      processed: 1,
      skipped: 0,
      failed: [],
      dryRun: false,
    });

    const row = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      include: { storedFile: { select: { key: true } } },
    });
    const record = await db.storedFile.findUniqueOrThrow({
      where: { mediaId: media.id },
    });
    const manifest = row.renditions as MediaRendition[];

    expect(record.key).toBe(`default/${media.id}/1/original`);
    expect(record.contentType).toBe("image/png");
    expect(row.metadata).toMatchObject({ width: 1000, height: 600 });
    expect(manifest).toHaveLength(MEDIA_RENDITION_WIDTHS.length * 2);
    expect(
      manifest.every((rendition) =>
        rendition.key.startsWith(`default/${media.id}/1/`),
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
    const address = mediaDeliveryAddress(row);
    expect(resolveMediaImageSource(address, 720)).toBe(
      await remoteDriver.url(avif720!.key),
    );
    expect(resolveMediaImageSource(address, 800)).toBe(
      await remoteDriver.url(avif720!.key),
    );
    expect(resolveMediaImageSource(address, 500)).toBe(
      await remoteDriver.url(avif480!.key),
    );

    // The row was written through the provider, so the manifest keeps the
    // provider addresses while the original address stays canonical.
    const delivered = decodeMediaManifest(
      new URL(address, "http://localhost").searchParams.get(MEDIA_MANIFEST_PARAM),
    );
    expect(
      delivered!.renditions.every((rendition) =>
        rendition.url.startsWith("https://fake-app.ufs.sh/f/"),
      ),
    ).toBe(true);

    for (const rendition of manifest) {
      await expect(remoteDriver.get(rendition.key)).resolves.toBeDefined();
    }
    await expect(remoteDriver.get(record.key)).resolves.toBeDefined();
  });

  it("reads the source from the stored-file record and records the facts it learns", async () => {
    const bytes = await createPng(700, 420);
    const id = randomUUID();
    const recordKey = `default/${id}/1/original`;
    await localDriver.put(recordKey, bytes, "image/png");

    // The record is the only place the bytes are named; the run reads it and
    // writes back the facts it learned from them.
    await createMedia({
      id,
      record: {
        key: recordKey,
        driver: "local",
        contentType: "image/png",
        size: bytes.byteLength,
      },
    });

    const report = await run();

    expect(report).toMatchObject({ scanned: 1, processed: 1, failed: [] });

    const row = await db.media.findUniqueOrThrow({ where: { id } });
    const record = await db.storedFile.findUniqueOrThrow({
      where: { mediaId: id },
    });
    const written = await localDriver.get(recordKey);

    expect(row.metadata).toMatchObject({ width: 700, height: 420 });
    expect(record).toMatchObject({
      key: recordKey,
      driver: "local",
      remoteUrl: null,
      contentType: "image/png",
      checksum: sha256(written),
    });
    expect(record.checksum).not.toBe(sha256(bytes));
    expect(record.size).toBe(written.byteLength);
  });

  it("moves a legacy record's key into the revision and keeps its remote address true", async () => {
    const bytes = await createPng(640, 320);
    const { media, legacyKey } = await createLegacyRemoteImage(bytes);
    const expectedKey = `default/${media.id}/1/original`;

    const report = await run();

    expect(report).toMatchObject({ scanned: 1, processed: 1, failed: [] });

    const record = await db.storedFile.findUniqueOrThrow({
      where: { mediaId: media.id },
    });

    expect(record).toMatchObject({
      key: expectedKey,
      driver: "uploadthing",
      remoteUrl: await remoteDriver.url(expectedKey),
      contentType: "image/png",
      checksum: sha256(await remoteDriver.get(expectedKey)),
      size: (await remoteDriver.get(expectedKey)).byteLength,
    });
    expect(record.checksum).not.toBe(sha256(bytes));

    // The legacy object is content's own address and survives the backfill.
    await expect(remoteDriver.get(legacyKey)).resolves.toBeDefined();
  });

  it("generates the ladder for a local image and keeps relative addresses", async () => {
    const { media, key } = await createLocalImage(await createPng());

    const report = await run();

    expect(report).toMatchObject({ scanned: 1, processed: 1, failed: [] });

    const row = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      include: { storedFile: { select: { key: true } } },
    });
    const record = await db.storedFile.findUniqueOrThrow({
      where: { mediaId: media.id },
    });
    const manifest = row.renditions as MediaRendition[];
    const address = mediaDeliveryAddress(row);

    expect(record.key).toBe(key);
    expect(address.startsWith(`/media/${key}`)).toBe(true);
    expect(address).not.toContain("://");
    const delivered = decodeMediaManifest(
      new URL(address, "http://localhost").searchParams.get(
        MEDIA_MANIFEST_PARAM,
      ),
    );
    expect(
      delivered!.renditions.every((rendition) =>
        rendition.url.startsWith("/media/"),
      ),
    ).toBe(true);
    expect(resolveMediaImageSource(address, 720)).toBe(
      await localDriver.url(
        manifest.find(
          (rendition) => rendition.width === 720 && rendition.format === "avif",
        )!.key,
      ),
    );

    for (const rendition of manifest) {
      await expect(localDriver.get(rendition.key)).resolves.toBeDefined();
    }
  });

  it("processes a mixed library, writing each row through its own driver", async () => {
    const { media: local } = await createLocalImage(await createPng());
    const { media: legacy, legacyKey } = await createLegacyRemoteImage(
      await createPng(900, 500),
    );

    const report = await run();

    expect(report).toMatchObject({
      scanned: 2,
      processed: 2,
      skipped: 0,
      failed: [],
    });

    const localRow = await db.media.findUniqueOrThrow({
      where: { id: local.id },
      include: { storedFile: { select: { key: true } } },
    });
    const legacyRow = await db.media.findUniqueOrThrow({
      where: { id: legacy.id },
      include: { storedFile: { select: { key: true } } },
    });
    const localManifest = localRow.renditions as MediaRendition[];
    const legacyManifest = legacyRow.renditions as MediaRendition[];

    // The local row's objects exist only on disk, the legacy row's only on the
    // provider: neither half could have been written by the other driver.
    function deliveredUrls(row: Parameters<typeof mediaDeliveryAddress>[0]): string[] {
      const manifest = decodeMediaManifest(
        new URL(mediaDeliveryAddress(row), "http://localhost").searchParams.get(
          MEDIA_MANIFEST_PARAM,
        ),
      );
      return manifest!.renditions.map((rendition) => rendition.url);
    }

    expect(
      deliveredUrls(localRow).every((url) => url.startsWith("/media/")),
    ).toBe(true);
    expect(
      deliveredUrls(legacyRow).every((url) =>
        url.startsWith("https://fake-app.ufs.sh/"),
      ),
    ).toBe(true);

    for (const rendition of localManifest) {
      await expect(localDriver.get(rendition.key)).resolves.toBeDefined();
      await expect(remoteDriver.get(rendition.key)).rejects.toBeDefined();
    }
    for (const rendition of legacyManifest) {
      await expect(remoteDriver.get(rendition.key)).resolves.toBeDefined();
      await expect(localDriver.get(rendition.key)).rejects.toBeDefined();
    }

    // The legacy provider object is the content's own address and survives.
    await expect(remoteDriver.get(legacyKey)).resolves.toBeDefined();
  });

  it("keeps the legacy source reachable for content that stored its absolute URL", async () => {
    const { media, legacyKey } = await createLegacyRemoteImage(await createPng());

    await run();

    await expect(remoteDriver.get(legacyKey)).resolves.toBeDefined();
    await expect(
      db.storedFile.findUniqueOrThrow({ where: { mediaId: media.id } }),
    ).resolves.toMatchObject({ key: `default/${media.id}/1/original` });
  });

  it("can be run twice without creating new objects or touching processed rows", async () => {
    await createLocalImage(await createPng());

    const first = await run();
    const storedAfterFirst = await listFiles(root);

    const media = await db.media.findFirstOrThrow({
      where: { id: { in: mediaIds } },
    });

    const report = await run();
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
    const { media: local } = await createLocalImage(await createPng());
    const { media: legacy } = await createLegacyRemoteImage(await createPng(640, 320));
    const before = await db.media.findUniqueOrThrow({
      where: { id: local.id },
      include: { storedFile: true },
    });
    const storedBefore = await listFiles(root);

    const report = await run({ dryRun: true });

    expect(report).toMatchObject({
      scanned: 2,
      processed: 0,
      skipped: 0,
      failed: [],
      dryRun: true,
    });
    expect(report.pending).toEqual(
      expect.arrayContaining([
        { mediaId: local.id, name: local.name },
        { mediaId: legacy.id, name: legacy.name },
      ]),
    );

    for (const id of [local.id, legacy.id]) {
      const after = await db.media.findUniqueOrThrow({ where: { id } });
      expect(after.renditions).toBeNull();
    }
    const afterLocal = await db.media.findUniqueOrThrow({
      where: { id: local.id },
      include: { storedFile: true },
    });
    expect(afterLocal.storedFile?.key).toBe(before.storedFile?.key);
    expect(afterLocal.storedFile?.remoteUrl).toBe(before.storedFile?.remoteUrl);
    expect(await listFiles(root)).toEqual(storedBefore);
  });

  it("reports an unavailable driver in a dry run without reading or writing", async () => {
    env = { MEDIA_STORAGE_LOCAL_ROOT: root };

    const { media: local } = await createLocalImage(await createPng());
    const unconfigured = await createMedia({
      key: `missing-${randomUUID()}`,
      url: "https://example.test/missing.png",
      storageDriver: "uploadthing",
    });
    const before = await db.media.findUniqueOrThrow({
      where: { id: local.id },
      include: { storedFile: true },
    });
    const storedBefore = await listFiles(root);

    const report = await run({ dryRun: true });

    expect(report).toMatchObject({
      scanned: 2,
      processed: 0,
      skipped: 0,
      dryRun: true,
    });
    expect(report.failed).toEqual([
      {
        mediaId: unconfigured.id,
        name: unconfigured.name,
        reason: 'storage driver "uploadthing" is not configured',
      },
    ]);
    expect(report.pending.map((item) => item.mediaId).sort()).toEqual(
      [local.id, unconfigured.id].sort(),
    );

    const after = await db.media.findUniqueOrThrow({
      where: { id: local.id },
      include: { storedFile: true },
    });
    expect(after.storedFile?.key).toBe(before.storedFile?.key);
    expect(after.renditions).toBeNull();
    expect(await listFiles(root)).toEqual(storedBefore);
  });

  it("reports a row whose recorded driver is unavailable and keeps the run going", async () => {
    env = { MEDIA_STORAGE_LOCAL_ROOT: root };

    const localBytes = await createPng(800, 480);
    const { media: healthy } = await createLocalImage(localBytes);

    // The record names a driver this instance has no credential for.
    const unconfiguredKey = `missing-${randomUUID()}`;
    const unconfigured = await createMedia({
      key: `stale-${randomUUID()}`,
      url: "https://example.test/missing.png",
      storageDriver: "local",
      record: { key: unconfiguredKey, driver: "uploadthing" },
    });

    const report = await run();

    expect(report.processed).toBe(1);
    expect(report.failed).toEqual([
      {
        mediaId: unconfigured.id,
        name: unconfigured.name,
        reason: 'storage driver "uploadthing" is not configured',
      },
    ]);
    await expect(
      db.storedFile.findUniqueOrThrow({ where: { mediaId: healthy.id } }),
    ).resolves.toMatchObject({ key: `default/${healthy.id}/1/original` });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: unconfigured.id } }),
    ).resolves.toMatchObject({ renditions: null });
  });

  it("reports a row with no stored-file record and keeps the run going", async () => {
    await createLegacyRemoteImage(await createPng());
    const orphan = await createMedia({ record: null });

    const report = await run();

    expect(report.processed).toBe(1);
    expect(report.failed).toEqual([
      {
        mediaId: orphan.id,
        name: orphan.name,
        reason: "no stored-file record with a storage key",
      },
    ]);
    await expect(
      db.storedFile.findUnique({ where: { mediaId: orphan.id } }),
    ).resolves.toBeNull();
    await expect(
      db.media.findUniqueOrThrow({ where: { id: orphan.id } }),
    ).resolves.toMatchObject({ renditions: null });
  });

  it("reports an unreachable source and keeps processing the rest", async () => {
    const { media: healthy } = await createLegacyRemoteImage(await createPng());
    const broken = await createMedia({
      key: `missing-${randomUUID()}`,
      url: "https://example.test/missing.png",
    });

    const report = await run();

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
      db.storedFile.findUniqueOrThrow({ where: { mediaId: healthy.id } }),
    ).resolves.toMatchObject({ key: `default/${healthy.id}/1/original` });
    await expect(
      db.media.findUniqueOrThrow({ where: { id: broken.id } }),
    ).resolves.toMatchObject({ renditions: null });
  });

  it("does not create storage objects when the source cannot be decoded", async () => {
    const brokenKey = `broken-${randomUUID()}`;
    await localDriver.put(brokenKey, new Uint8Array([1, 2, 3, 4]), "image/png");
    const media = await createMedia({
      key: brokenKey,
      url: storedFilePath("MEDIA", brokenKey),
    });

    const report = await run();

    expect(report.processed).toBe(0);
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0]).toMatchObject({ mediaId: media.id });
    expect(await listFiles(root)).toEqual([brokenKey]);
    await expect(
      db.media.findUniqueOrThrow({
        where: { id: media.id },
        include: { storedFile: true },
      }),
    ).resolves.toMatchObject({
      renditions: null,
      storedFile: { key: brokenKey },
    });
  });

  it("keeps an archived image on its original until it is restored", async () => {
    const { media } = await createLocalImage(await createPng());
    await archiveMedia(media.id);

    await run();

    const archived = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      include: { storedFile: { select: { key: true } } },
    });
    const manifest = archived.renditions as MediaRendition[];
    const originalUrl = await localDriver.url(archived.storedFile!.key);

    expect(resolveMediaImageSource(mediaDeliveryAddress(archived), 720)).toBe(
      originalUrl,
    );

    await restoreMedia(media.id);
    const restored = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      include: { storedFile: { select: { key: true } } },
    });
    const avif720 = manifest.find(
      (rendition) => rendition.width === 720 && rendition.format === "avif",
    );

    expect(resolveMediaImageSource(mediaDeliveryAddress(restored), 720)).toBe(
      await localDriver.url(avif720!.key),
    );
  });

  it("bounds how many sources are read at once", async () => {
    for (let index = 0; index < 5; index += 1) {
      await createLocalImage(await createPng());
    }

    let activeReads = 0;
    let peak = 0;
    active = {
      name: "local",
      driver: {
        ...localDriver,
        get: async (key) => {
          activeReads += 1;
          peak = Math.max(peak, activeReads);
          try {
            await delay(25);
            return await localDriver.get(key);
          } finally {
            activeReads -= 1;
          }
        },
      },
    };

    const report = await run({ concurrency: 2 });

    expect(report.processed).toBe(5);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("ignores non-image media", async () => {
    const key = `uploads/${randomUUID()}`;
    await localDriver.put(key, new Uint8Array([1, 2, 3]), "application/pdf");
    const file = await createMedia({
      key,
      url: "https://example.test/brochure.pdf",
      type: MediaType.FILE,
    });

    const report = await run();

    expect(report.scanned).toBe(0);
    await expect(
      db.media.findUniqueOrThrow({
        where: { id: file.id },
        include: { storedFile: true },
      }),
    ).resolves.toMatchObject({
      renditions: null,
      storedFile: { key },
    });
  });
});
