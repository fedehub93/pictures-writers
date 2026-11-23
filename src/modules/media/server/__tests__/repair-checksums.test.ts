import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import {
  checksumRepairExitCode,
  repairMediaChecksums,
} from "../repair-checksums";
import { rehomeStoredFiles } from "../rehome";
import type {
  ResolvedStorageDriver,
  StorageEnvironment,
} from "../storage/driver";
import { createFakeUploadThingApi } from "../storage/__tests__/fake-uploadthing";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";
import { createUploadThingStorageDriver } from "../storage/uploadthing";

const UFS_URL = "https://fake-app.ufs.sh/f/";

function sha256(bytes: Uint8Array<ArrayBuffer>): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function createPng(
  width = 400,
  height = 300,
  compressionLevel?: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 20, g: 160, b: 80 },
    },
  })
    .png(compressionLevel === undefined ? {} : { compressionLevel })
    .toBuffer();

  return new Uint8Array(buffer);
}

describe("repairMediaChecksums", () => {
  let root: string;
  let local: StorageDriver;
  let active: ResolvedStorageDriver;
  let provider: StorageDriver;
  let fake: ReturnType<typeof createFakeUploadThingApi>;
  let env: StorageEnvironment;
  let fileIds: string[];

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-checksums-"));
    local = createLocalStorageDriver({ root });
    active = { name: "local", driver: local };
    fake = createFakeUploadThingApi();
    provider = createUploadThingStorageDriver(fake.api, fake.fetch);
    env = {
      MEDIA_STORAGE_LOCAL_ROOT: root,
      UPLOADTHING_TOKEN: "fake-token",
    };
    fileIds = [];
  });

  afterEach(async () => {
    if (fileIds.length > 0) {
      await db.storedFile.deleteMany({ where: { id: { in: fileIds } } });
    }
    await rm(root, { recursive: true, force: true });
  });

  /**
   * A remote record whose checksum describes the bytes the backfill read as a
   * source, while its size and address describe the normalised copy it wrote.
   */
  async function createRemoteFile({
    stored,
    source,
    contentType = "image/png",
    size,
  }: {
    stored: Uint8Array<ArrayBuffer>;
    source?: Uint8Array<ArrayBuffer>;
    contentType?: string | null;
    size?: number | null;
  }) {
    const key = `default/${randomUUID()}/1/original`;
    await provider.put(key, stored, "image/png");

    const file = await db.storedFile.create({
      data: {
        key,
        driver: "uploadthing",
        remoteUrl: await provider.url(key),
        contentType,
        size: size === undefined ? stored.byteLength : size,
        checksum: sha256(source ?? stored),
      },
    });

    fileIds.push(file.id);
    return { file, key, stored };
  }

  function repair(
    overrides: Partial<Parameters<typeof repairMediaChecksums>[0]> = {},
  ) {
    return repairMediaChecksums({
      active,
      env,
      fileIds,
      fetchImpl: fake.fetch,
      drivers: { uploadthing: provider },
      ...overrides,
    });
  }

  it("rewrites the record from the bytes its address serves, and a dry run writes nothing", async () => {
    const stored = await createPng(400, 300, 9);
    const source = await createPng(400, 300, 1);
    const { file, key } = await createRemoteFile({ stored, source });

    const preview = await repair({ dryRun: true });

    expect(preview).toMatchObject({
      scanned: 1,
      updated: 1,
      unchanged: 0,
      failed: [],
      dryRun: true,
    });
    expect(
      await db.storedFile.findUniqueOrThrow({ where: { id: file.id } }),
    ).toMatchObject({ checksum: sha256(source), size: stored.byteLength });

    const report = await repair();

    expect(report).toMatchObject({
      scanned: 1,
      updated: 1,
      unchanged: 0,
      failed: [],
      dryRun: false,
    });

    const repaired = await db.storedFile.findUniqueOrThrow({
      where: { id: file.id },
    });
    expect(repaired).toMatchObject({
      key,
      checksum: sha256(stored),
      size: stored.byteLength,
      contentType: "image/png",
    });

    // The second run finds the record already true: idempotence is the proof
    // the column now describes the object the record carries.
    const again = await repair();
    expect(again).toMatchObject({
      scanned: 1,
      updated: 0,
      unchanged: 1,
      failed: [],
    });
  });

  it("corrects a size and content type that disagree with the bytes", async () => {
    const stored = await createPng(320, 240, 9);
    const { file } = await createRemoteFile({
      stored,
      source: await createPng(320, 240, 1),
      contentType: "application/octet-stream",
      size: 12,
    });

    const report = await repair();

    expect(report.updated).toBe(1);
    await expect(
      db.storedFile.findUniqueOrThrow({ where: { id: file.id } }),
    ).resolves.toMatchObject({
      contentType: "image/png",
      size: stored.byteLength,
      checksum: sha256(stored),
    });
  });

  it("reads the recorded address when the provider API cannot resolve the key", async () => {
    const stored = await createPng(400, 300, 9);
    const { file } = await createRemoteFile({
      stored,
      source: await createPng(400, 300, 1),
    });

    const unreadableKeys: StorageDriver = {
      ...provider,
      get: async () => {
        throw new Error("the key API does not resolve this file");
      },
    };

    const report = await repair({
      drivers: { uploadthing: unreadableKeys },
    });

    expect(report).toMatchObject({ updated: 1, failed: [] });
    await expect(
      db.storedFile.findUniqueOrThrow({ where: { id: file.id } }),
    ).resolves.toMatchObject({ checksum: sha256(stored) });
  });

  it("reports a file whose bytes it cannot read and leaves it alone", async () => {
    const bytes = await createPng(200, 150, 6);
    const missingKey = `missing-${randomUUID()}`;
    const file = await db.storedFile.create({
      data: {
        key: missingKey,
        driver: "uploadthing",
        remoteUrl: `${UFS_URL}${encodeURIComponent(missingKey)}`,
        contentType: "image/png",
        size: bytes.byteLength,
        checksum: sha256(bytes),
      },
    });
    fileIds.push(file.id);

    const report = await repair();

    expect(report).toMatchObject({ scanned: 1, updated: 0, unchanged: 0 });
    expect(report.failed).toEqual([
      {
        fileId: file.id,
        driver: "uploadthing",
        reason: "unreadable",
      },
    ]);
    expect(checksumRepairExitCode(report)).toBe(1);
    await expect(
      db.storedFile.findUniqueOrThrow({ where: { id: file.id } }),
    ).resolves.toMatchObject({
      checksum: sha256(bytes),
      size: bytes.byteLength,
    });
  });

  it("groups the report by the driver each record names", async () => {
    const stored = await createPng(400, 300, 9);
    const remote = await createRemoteFile({
      stored,
      source: await createPng(400, 300, 1),
    });

    const localKey = `default/${randomUUID()}/1/original`;
    await local.put(localKey, stored, "image/png");
    const localFile = await db.storedFile.create({
      data: {
        key: localKey,
        driver: "local",
        remoteUrl: null,
        contentType: "image/png",
        size: stored.byteLength,
        checksum: sha256(stored),
      },
    });
    fileIds.push(localFile.id);

    const report = await repair({ fileIds: [remote.file.id, localFile.id] });

    expect(report.scanned).toBe(2);
    expect(report.drivers).toEqual([
      { driver: "local", scanned: 1, updated: 0, unchanged: 1, failed: 0 },
      { driver: "uploadthing", scanned: 1, updated: 1, unchanged: 0, failed: 0 },
    ]);
  });

  it("repairs a local record from the bytes on the volume", async () => {
    const stored = await createPng(400, 300, 9);
    const source = await createPng(400, 300, 1);
    const key = `default/${randomUUID()}/1/original`;
    await local.put(key, stored, "image/png");

    const file = await db.storedFile.create({
      data: {
        key,
        driver: "local",
        remoteUrl: null,
        contentType: "image/png",
        size: stored.byteLength,
        checksum: sha256(source),
      },
    });
    fileIds.push(file.id);

    const report = await repair({ fileIds: [file.id] });

    expect(report).toMatchObject({ scanned: 1, updated: 1, failed: [] });
    await expect(
      db.storedFile.findUniqueOrThrow({ where: { id: file.id } }),
    ).resolves.toMatchObject({ checksum: sha256(stored) });
  });

  it("moves a repaired file to the target without a checksum mismatch", async () => {
    const stored = await createPng(400, 300, 9);
    const { file, key } = await createRemoteFile({
      stored,
      source: await createPng(400, 300, 1),
    });

    await repair();

    const report = await rehomeStoredFiles({
      target: { name: "local", driver: local },
      env,
      fileIds: [file.id],
      availableDiskBytes: null,
      drivers: { uploadthing: provider },
      fetchImpl: fake.fetch,
      isSuperseded: async () => false,
    });

    expect(report).toMatchObject({ moved: 1, failed: [] });
    await expect(local.get(key)).resolves.toEqual(stored);
    await expect(
      db.storedFile.findUniqueOrThrow({ where: { id: file.id } }),
    ).resolves.toMatchObject({
      driver: "local",
      remoteUrl: null,
      checksum: sha256(stored),
    });

    await db.storagePurgeEntry.deleteMany({ where: { key } });
  });
});
