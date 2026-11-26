import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType, StoredFileKind, StoredFileOrigin } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { BYTES_PER_MEGABYTE } from "@/modules/media/lib/quota";

import {
  createMediaFromUpload,
  MediaProcessingError,
} from "../media-service";
import {
  MediaQuotaExceededError,
  getMediaQuotaStatus,
  getMediaStorageDetails,
  getMediaUsageBytes,
} from "../media-quota";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";
import {
  resetMediaQuota,
  setMediaQuotaMb,
  setPublicOriginReserveMb,
} from "./quota-fixtures";

const MB = BYTES_PER_MEGABYTE;

async function listFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relative)),
      );
    } else {
      files.push(relative);
    }
  }

  return files;
}

async function createSolidPng(): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width: 600,
      height: 400,
      channels: 3,
      background: { r: 40, g: 120, b: 200 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

describe("media quota", () => {
  let root: string;
  let driver: StorageDriver;
  const createdIds: string[] = [];
  const storedFileIds: string[] = [];

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-quota-"));
    driver = createLocalStorageDriver({ root });
  });

  afterEach(async () => {
    await resetMediaQuota();

    if (createdIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: createdIds } } });
      createdIds.length = 0;
    }

    if (storedFileIds.length > 0) {
      await db.storedFile.deleteMany({ where: { id: { in: storedFileIds } } });
      storedFileIds.length = 0;
    }

    await rm(root, { recursive: true, force: true });
  });

  async function createOwnedFile(input: {
    kind: StoredFileKind;
    size: number;
    origin?: StoredFileOrigin;
  }): Promise<string> {
    const id = randomUUID();
    storedFileIds.push(id);

    await db.storedFile.create({
      data: {
        id,
        key: `default/${id}/1/file`,
        driver: "local",
        size: input.size,
        kind: input.kind,
        origin: input.origin ?? StoredFileOrigin.INTERNAL,
      },
    });

    return id;
  }

  async function createRow(input: {
    size: number | null;
    renditions?: unknown;
    archivedAt?: Date | null;
    /** The record's size, when it differs from the Media's own (ignored) size. */
    file?: { size: number | null };
  }) {
    const id = randomUUID();
    createdIds.push(id);

    return db.media.create({
      data: {
        id,
        name: `quota-${id}`,
        renditions: input.renditions as PrismaJson.MediaRenditions,
        archivedAt: input.archivedAt ?? null,
        storedFile: {
          create: {
            key: `default/${id}/1/original`,
            driver: "local",
            size: input.file ? input.file.size : input.size,
          },
        },
      },
    });
  }

  it("counts originals and rendition manifests over archived Media too", async () => {
    const baseline = await getMediaUsageBytes();

    await createRow({
      size: 1000,
      renditions: [
        { key: "a", width: 320, height: 200, bytes: 150, format: "webp" },
        { key: "b", width: 320, height: 200, bytes: 50, format: "avif" },
      ],
      archivedAt: new Date("2026-11-18T10:00:00Z"),
    });
    await createRow({ size: 2000, renditions: null });

    await expect(getMediaUsageBytes()).resolves.toBe(baseline + 3200);
  });

  it("counts a record's size and its rendition manifest", async () => {
    const baseline = await getMediaUsageBytes();

    await createRow({
      size: 1000,
      renditions: [
        { key: "a", width: 320, height: 200, bytes: 200, format: "webp" },
      ],
      file: { size: 2500 },
    });

    // The record answers "where are the bytes"; the rendition manifest is the
    // role's contribution on top of it.
    await expect(getMediaUsageBytes()).resolves.toBe(baseline + 2700);
  });

  it("counts an archived file's record", async () => {
    const baseline = await getMediaUsageBytes();

    await createRow({
      size: 1000,
      archivedAt: new Date("2026-11-18T10:00:00Z"),
      file: { size: 2500 },
    });

    await expect(getMediaUsageBytes()).resolves.toBe(baseline + 2500);
  });

  it("counts attachments and avatars beside Media in the same budget", async () => {
    const baseline = await getMediaUsageBytes();

    await createOwnedFile({
      kind: StoredFileKind.ATTACHMENT,
      size: 700,
    });
    await createOwnedFile({
      kind: StoredFileKind.AVATAR,
      size: 900,
    });

    await expect(getMediaUsageBytes()).resolves.toBe(baseline + 1600);
  });

  it("counts an attachment in the total but in no Media type row", async () => {
    const before = await getMediaStorageDetails();

    await createOwnedFile({
      kind: StoredFileKind.ATTACHMENT,
      size: 700,
    });

    const after = await getMediaStorageDetails();

    expect(after.quota.usedBytes - before.quota.usedBytes).toBe(700);
    expect(after.byMediaType).toEqual(before.byMediaType);
  });

  it("names the public-origin share against the reserve", async () => {
    const baseline = await getMediaQuotaStatus();
    await setPublicOriginReserveMb(2);
    await setMediaQuotaMb(10);

    await createOwnedFile({
      kind: StoredFileKind.ATTACHMENT,
      size: 700,
      origin: StoredFileOrigin.PUBLIC,
    });
    await createOwnedFile({
      kind: StoredFileKind.ATTACHMENT,
      size: 900,
      origin: StoredFileOrigin.INTERNAL,
    });

    const status = await getMediaQuotaStatus();

    expect(status.usedBytes).toBe(baseline.usedBytes + 1600);
    expect(status.publicBytes).toBe(baseline.publicBytes + 700);
    expect(status.totalBytes).toBe(10 * MB);
    expect(status.reserveBytes).toBe(2 * MB);
  });

  it("removes the written objects when the check before the row fails", async () => {
    const baseline = await getMediaUsageBytes();
    const quotaMb = Math.ceil((baseline + 1) / MB);

    // Fill the library to exactly its quota, so any image would overrun it.
    await createRow({ size: quotaMb * MB - baseline, renditions: null });
    await setMediaQuotaMb(quotaMb);

    const bytes = await createSolidPng();
    const sourceKey = `uploads/${randomUUID()}`;
    await driver.put(sourceKey, bytes, "image/png");

    const filesBefore = await listFiles(root);
    const name = `quota-image-${randomUUID()}`;

    await expect(
      createMediaFromUpload({
        driver,
        storageDriver: "local",
        source: {
          key: sourceKey,
          name,
          type: MediaType.IMAGE,
          mimeType: "image/png",
        },
      }),
    ).rejects.toBeInstanceOf(MediaQuotaExceededError);

    await expect(db.media.count({ where: { name } })).resolves.toBe(0);
    await expect(
      db.storedFile.count({ where: { media: { name } } }),
    ).resolves.toBe(0);
    await expect(listFiles(root)).resolves.toEqual(filesBefore);
  });

  it("removes the revision and the temporary object when the quota refuses a non-image", async () => {
    const baseline = await getMediaUsageBytes();
    const quotaMb = Math.ceil((baseline + 1) / MB);

    await createRow({ size: quotaMb * MB - baseline, renditions: null });
    await setMediaQuotaMb(quotaMb);

    const bytes = new Uint8Array(1024).fill(3);
    const sourceKey = `tmp/${randomUUID()}`;
    await driver.put(sourceKey, bytes, "application/pdf");

    const name = `quota-document-${randomUUID()}`;

    await expect(
      createMediaFromUpload({
        driver,
        storageDriver: "local",
        source: {
          key: sourceKey,
          name,
          type: MediaType.FILE,
          mimeType: "application/pdf",
        },
      }),
    ).rejects.toBeInstanceOf(MediaQuotaExceededError);

    await expect(db.media.count({ where: { name } })).resolves.toBe(0);
    await expect(
      db.storedFile.count({ where: { media: { name } } }),
    ).resolves.toBe(0);

    await expect(listFiles(root)).resolves.toEqual([]);
  });

  it("keeps the previous error type for a broken image", async () => {
    const sourceKey = `uploads/${randomUUID()}`;
    await driver.put(sourceKey, new Uint8Array([1, 2, 3]), "image/png");

    await expect(
      createMediaFromUpload({
        driver,
        storageDriver: "local",
        source: {
          key: sourceKey,
          name: `broken-${randomUUID()}`,
          type: MediaType.IMAGE,
          mimeType: "image/png",
        },
      }),
    ).rejects.toBeInstanceOf(MediaProcessingError);
  });
});
