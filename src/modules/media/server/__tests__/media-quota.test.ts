import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { BYTES_PER_MEGABYTE } from "@/modules/media/lib/quota";

import {
  createMediaFromUpload,
  MediaProcessingError,
} from "../media-service";
import {
  MediaQuotaExceededError,
  getMediaUsageBytes,
} from "../media-quota";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";
import { resetMediaQuota, setMediaQuotaMb } from "./quota-fixtures";

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

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-quota-"));
    driver = createLocalStorageDriver({ root, publicBaseUrl: "/media" });
  });

  afterEach(async () => {
    await resetMediaQuota();

    if (createdIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: createdIds } } });
      createdIds.length = 0;
    }

    await rm(root, { recursive: true, force: true });
  });

  async function createRow(input: {
    size: number | null;
    renditions?: unknown;
    archivedAt?: Date | null;
  }) {
    const id = randomUUID();
    createdIds.push(id);

    return db.media.create({
      data: {
        id,
        name: `quota-${id}`,
        url: `/media/quota-${id}`,
        size: input.size,
        renditions: input.renditions as PrismaJson.MediaRenditions,
        archivedAt: input.archivedAt ?? null,
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

  it("refuses a plain Media row past the quota and creates no row", async () => {
    await setMediaQuotaMb(1);

    const name = `quota-plain-${randomUUID()}`;

    await expect(
      createMediaFromUpload({
        driver,
        storageDriver: "local",
        source: {
          key: null,
          url: `/media/${name}`,
          name,
          type: MediaType.FILE,
          size: 2 * MB,
        },
      }),
    ).rejects.toBeInstanceOf(MediaQuotaExceededError);

    await expect(db.media.count({ where: { name } })).resolves.toBe(0);
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
          url: `/media/${sourceKey}`,
          name,
          type: MediaType.IMAGE,
          mimeType: "image/png",
        },
      }),
    ).rejects.toBeInstanceOf(MediaQuotaExceededError);

    await expect(db.media.count({ where: { name } })).resolves.toBe(0);
    await expect(listFiles(root)).resolves.toEqual(filesBefore);
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
          url: `/media/${sourceKey}`,
          name: `broken-${randomUUID()}`,
          type: MediaType.IMAGE,
          mimeType: "image/png",
        },
      }),
    ).rejects.toBeInstanceOf(MediaProcessingError);
  });
});
