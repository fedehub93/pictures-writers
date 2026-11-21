import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { buildMediaDeliveryUrl } from "@/modules/media/lib/manifest";
import { storedFilePath } from "@/modules/media/lib/file-path";

import { findDeliveryFile } from "../media-delivery";
import {
  pendingPurge,
  PurgeConfirmationRequiredError,
  purgeStorageObjects,
} from "../purge";
import { rehomeStoredFiles } from "../rehome";
import type { StorageEnvironment } from "../storage/driver";
import { createFakeUploadThingApi } from "../storage/__tests__/fake-uploadthing";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";
import { createUploadThingStorageDriver } from "../storage/uploadthing";

const DAY_MS = 24 * 60 * 60 * 1000;

function sha256(bytes: Uint8Array<ArrayBuffer>): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function bytesOf(length: number, seed = 1): Uint8Array<ArrayBuffer> {
  return Uint8Array.from({ length }, (_, index) => (index * seed) % 251);
}

function expired(): Date {
  return new Date(Date.now() - 8 * DAY_MS);
}

interface CreatedMedia {
  mediaId: string;
  fileId: string;
  key: string;
  original: Uint8Array<ArrayBuffer>;
  renditions: {
    key: string;
    bytes: Uint8Array<ArrayBuffer>;
    width: number;
    format: "avif" | "webp";
  }[];
}

describe("purgeStorageObjects", () => {
  let root: string;
  let local: StorageDriver;
  let provider: StorageDriver;
  let fake: ReturnType<typeof createFakeUploadThingApi>;
  let env: StorageEnvironment;
  let mediaIds: string[];
  let purgeKeys: string[];

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-purge-"));
    local = createLocalStorageDriver({ root });
    fake = createFakeUploadThingApi();
    provider = createUploadThingStorageDriver(fake.api, fake.fetch);

    env = {
      MEDIA_STORAGE_LOCAL_ROOT: root,
      UPLOADTHING_TOKEN: "fake-token",
    };

    mediaIds = [];
    purgeKeys = [];
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    if (purgeKeys.length > 0) {
      await db.storagePurgeEntry.deleteMany({
        where: { key: { in: purgeKeys } },
      });
    }

    await rm(root, { recursive: true, force: true });
  });

  function purge(
    overrides: Partial<Parameters<typeof purgeStorageObjects>[0]> = {},
  ) {
    return purgeStorageObjects({
      driver: "uploadthing",
      confirmation: "uploadthing",
      env,
      drivers: { uploadthing: provider },
      ...overrides,
    });
  }

  /** A Media whose original and renditions the fake provider holds. */
  async function createRemoteMedia({
    originalBytes = 1000,
    renditions = [{ width: 320, bytes: 200, format: "webp" as const }],
  }: {
    originalBytes?: number;
    renditions?: { width: number; bytes: number; format: "avif" | "webp" }[];
  } = {}): Promise<CreatedMedia> {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const original = bytesOf(originalBytes);
    const checksum = sha256(original);

    await provider.put(key, original, "image/png");
    const remoteUrl = await provider.url(key);

    const manifest: {
      key: string;
      width: number;
      height: number;
      bytes: number;
      format: "avif" | "webp";
    }[] = [];
    const renditionInputs: {
      width: number;
      format: "avif" | "webp";
      url: string;
    }[] = [];
    const renditionObjects: CreatedMedia["renditions"] = [];

    for (const spec of renditions) {
      const renditionKey = `default/${id}/1/${spec.width}.${spec.format}`;
      const renditionBytes = bytesOf(spec.bytes, 7);

      await provider.put(
        renditionKey,
        renditionBytes,
        `image/${spec.format}`,
      );
      const renditionUrl = await provider.url(renditionKey);

      manifest.push({
        key: renditionKey,
        width: spec.width,
        height: 200,
        bytes: spec.bytes,
        format: spec.format,
      });
      renditionInputs.push({
        width: spec.width,
        format: spec.format,
        url: renditionUrl,
      });
      renditionObjects.push({
        key: renditionKey,
        bytes: renditionBytes,
        width: spec.width,
        format: spec.format,
      });
    }

    const address = buildMediaDeliveryUrl(storedFilePath("MEDIA", key), {
      revision: 1,
      archived: false,
      renditions: renditionInputs,
    });

    const media = await db.media.create({
      data: {
        id,
        name: `Purge remote ${id}`,
        type: MediaType.IMAGE,
        revision: 1,
        renditions: manifest as PrismaJson.MediaRenditions,
        storedFile: {
          create: {
            key,
            driver: "uploadthing",
            remoteUrl,
            contentType: "image/png",
            size: originalBytes,
            checksum,
          },
        },
      },
      include: { storedFile: { select: { id: true } } },
    });

    mediaIds.push(id);
    purgeKeys.push(key, ...manifest.map((rendition) => rendition.key));

    return {
      mediaId: id,
      fileId: media.storedFile!.id,
      key,
      original,
      renditions: renditionObjects,
    };
  }

  /** A journal entry for an object the fake provider holds. */
  async function createJournalEntry({
    driver = "uploadthing",
    size = 100,
    legacy = false,
    createdAt = new Date(),
  }: {
    driver?: string;
    size?: number | null;
    legacy?: boolean;
    createdAt?: Date;
  } = {}) {
    const key = legacy
      ? `legacy-${randomUUID()}`
      : `default/${randomUUID()}/1/${randomUUID()}`;
    const bytes = bytesOf(size ?? 10);

    if (legacy) {
      fake.putLegacyObject(key, bytes, "image/png");
    } else {
      await provider.put(key, bytes, "image/png");
    }

    const entry = await db.storagePurgeEntry.create({
      data: { driver, key, size, createdAt },
    });
    purgeKeys.push(key);
    return entry;
  }

  /** A Media with no stored file: the audit reports it, so it is not green. */
  async function createUnrecordedMedia() {
    const id = randomUUID();
    const media = await db.media.create({
      data: {
        id,
        name: `Purge unrecorded ${id}`,
        type: MediaType.IMAGE,
      },
    });
    mediaIds.push(id);
    return media;
  }

  function moveToLocal(fileId: string) {
    return rehomeStoredFiles({
      target: { name: "local", driver: local },
      env,
      fileIds: [fileId],
      availableDiskBytes: null,
      drivers: { uploadthing: provider },
      isSuperseded: async () => false,
    });
  }

  it("leaves objects younger than the grace window alone and reports them waiting", async () => {
    const first = await createJournalEntry();
    const second = await createJournalEntry();

    const report = await purge();

    expect(report).toEqual({
      driver: "uploadthing",
      entries: 2,
      eligible: 0,
      deleted: 0,
      waiting: 2,
      bytesDeleted: 0,
      failed: [],
    });

    expect(
      await db.storagePurgeEntry.count({
        where: { id: { in: [first.id, second.id] } },
      }),
    ).toBe(2);
    await expect(provider.get(first.key)).resolves.toEqual(bytesOf(100));
    await expect(provider.get(second.key)).resolves.toEqual(bytesOf(100));
  });

  it("refuses while any stored file still records the driver, and deletes nothing", async () => {
    const remote = await createRemoteMedia({ renditions: [] });
    const entry = await createJournalEntry({ createdAt: expired() });
    let asked = 0;

    await expect(
      purge({
        confirmation: async () => {
          asked += 1;
          return "uploadthing";
        },
      }),
    ).rejects.toMatchObject({
      code: "PURGE_REFUSED",
      reason: "files-on-driver",
    });

    expect(asked).toBe(0);
    expect(await db.storagePurgeEntry.count({ where: { id: entry.id } })).toBe(
      1,
    );
    await expect(provider.get(entry.key)).resolves.toBeDefined();
    await expect(provider.get(remote.key)).resolves.toEqual(remote.original);
  });

  it("refuses while the audit is not green, and deletes nothing", async () => {
    await createUnrecordedMedia();
    const entry = await createJournalEntry({ createdAt: expired() });

    await expect(purge()).rejects.toMatchObject({
      code: "PURGE_REFUSED",
      reason: "audit-not-green",
    });

    expect(await db.storagePurgeEntry.count({ where: { id: entry.id } })).toBe(
      1,
    );
    await expect(provider.get(entry.key)).resolves.toBeDefined();
  });

  it("requires the driver name typed as confirmation before deleting anything", async () => {
    const entry = await createJournalEntry({ createdAt: expired() });

    await expect(purge({ confirmation: "yes" })).rejects.toBeInstanceOf(
      PurgeConfirmationRequiredError,
    );

    await expect(
      purge({ confirmation: undefined }),
    ).rejects.toBeInstanceOf(PurgeConfirmationRequiredError);

    expect(await db.storagePurgeEntry.count({ where: { id: entry.id } })).toBe(
      1,
    );
    await expect(provider.get(entry.key)).resolves.toBeDefined();
  });

  it("refuses to purge the local driver", async () => {
    await createJournalEntry({ driver: "local", createdAt: expired() });

    await expect(
      purgeStorageObjects({
        driver: "local",
        confirmation: "local",
        env,
      }),
    ).rejects.toMatchObject({
      code: "PURGE_REFUSED",
      reason: "not-a-provider",
    });
  });

  it("refuses to purge a driver this instance has no credentials for", async () => {
    await createJournalEntry({ createdAt: expired() });

    await expect(
      purge({
        env: { MEDIA_STORAGE_LOCAL_ROOT: root },
        drivers: undefined,
      }),
    ).rejects.toMatchObject({
      code: "PURGE_REFUSED",
      reason: "driver-unconfigured",
    });
  });

  it("reports one provider failure by entry and continues the rest of the batch", async () => {
    const failing = await createJournalEntry({ size: 300, createdAt: expired() });
    const healthy = await createJournalEntry({ size: 120, createdAt: expired() });

    const flaky: StorageDriver = {
      ...provider,
      delete: async (key) => {
        if (key === failing.key) throw new Error("provider unavailable");
        await provider.delete(key);
      },
    };

    const report = await purge({ drivers: { uploadthing: flaky } });

    expect(report).toEqual({
      driver: "uploadthing",
      entries: 2,
      eligible: 2,
      deleted: 1,
      waiting: 0,
      bytesDeleted: 120,
      failed: [{ entryId: failing.id, reason: "delete-failed" }],
    });

    expect(
      await db.storagePurgeEntry.count({ where: { id: failing.id } }),
    ).toBe(1);
    expect(
      await db.storagePurgeEntry.count({ where: { id: healthy.id } }),
    ).toBe(0);
    await expect(provider.get(failing.key)).resolves.toBeDefined();
    await expect(provider.get(healthy.key)).rejects.toThrow();
  });

  it("finds nothing to delete on a second run and reports zero, token or not", async () => {
    await createJournalEntry({ createdAt: expired() });

    const first = await purge();
    expect(first).toMatchObject({ deleted: 1, failed: [] });

    const second = await purge({
      env: { MEDIA_STORAGE_LOCAL_ROOT: root },
      drivers: undefined,
    });

    expect(second).toEqual({
      driver: "uploadthing",
      entries: 0,
      eligible: 0,
      deleted: 0,
      waiting: 0,
      bytesDeleted: 0,
      failed: [],
    });
  });

  it("deletes a pre-seam flat key the journal recorded", async () => {
    const entry = await createJournalEntry({ legacy: true, createdAt: expired() });

    const report = await purge();

    expect(report).toMatchObject({
      entries: 1,
      eligible: 1,
      deleted: 1,
      failed: [],
    });
    expect(await db.storagePurgeEntry.count({ where: { id: entry.id } })).toBe(
      0,
    );
    await expect(provider.get(entry.key)).rejects.toThrow();
  });

  it("skips an entry a newer move made live again", async () => {
    const first = await createJournalEntry({ createdAt: expired() });
    const revived = await createJournalEntry({
      createdAt: new Date(Date.now() - 7.5 * DAY_MS),
    });

    const racing: StorageDriver = {
      ...provider,
      delete: async (key) => {
        // A Re-home back onto this driver removes the journal entry for a key
        // it copies, which is the signal that the key is live again.
        if (key === first.key) {
          await db.storagePurgeEntry.delete({ where: { id: revived.id } });
        }
        await provider.delete(key);
      },
    };

    const report = await purge({ drivers: { uploadthing: racing } });

    expect(report).toMatchObject({
      entries: 2,
      eligible: 2,
      deleted: 1,
      failed: [],
    });
    expect(
      await db.storagePurgeEntry.count({ where: { id: revived.id } }),
    ).toBe(0);
    await expect(provider.get(revived.key)).resolves.toBeDefined();
  });

  it("removes a journal entry whose object the provider already lost", async () => {
    const entry = await createJournalEntry({ createdAt: expired() });
    await provider.delete(entry.key);

    const report = await purge();

    expect(report).toMatchObject({
      entries: 1,
      eligible: 1,
      deleted: 1,
      waiting: 0,
      failed: [],
    });
    expect(await db.storagePurgeEntry.count({ where: { id: entry.id } })).toBe(
      0,
    );
  });

  it("summarises the journal per driver, splitting what is still waiting", async () => {
    const now = new Date();
    await createJournalEntry({
      size: 300,
      createdAt: new Date(now.getTime() - 8 * DAY_MS),
    });
    await createJournalEntry({
      size: 50,
      createdAt: new Date(now.getTime() - 1 * DAY_MS),
    });
    await createJournalEntry({
      driver: "s3",
      size: 25,
      createdAt: new Date(now.getTime() - 9 * DAY_MS),
    });

    await expect(pendingPurge({ now })).resolves.toEqual([
      { driver: "s3", entries: 1, eligible: 1, waiting: 0, bytes: 25 },
      {
        driver: "uploadthing",
        entries: 2,
        eligible: 1,
        waiting: 1,
        bytes: 350,
      },
    ]);
  });

  it("deletes a move's objects after the grace window and leaves the local copies serving", async () => {
    const created = await createRemoteMedia();

    const move = await moveToLocal(created.fileId);
    expect(move).toMatchObject({ moved: 1, failed: [], abandoned: 2 });

    const keys = [created.key, ...created.renditions.map(({ key }) => key)];
    await db.storagePurgeEntry.updateMany({
      where: { driver: "uploadthing", key: { in: keys } },
      data: { createdAt: expired() },
    });

    const report = await purge();

    expect(report).toEqual({
      driver: "uploadthing",
      entries: 2,
      eligible: 2,
      deleted: 2,
      waiting: 0,
      bytesDeleted: 1200,
      failed: [],
    });

    expect(
      await db.storagePurgeEntry.count({
        where: { driver: "uploadthing", key: { in: keys } },
      }),
    ).toBe(0);

    await expect(provider.get(created.key)).rejects.toThrow();
    await expect(provider.get(created.renditions[0]!.key)).rejects.toThrow();

    await expect(local.get(created.key)).resolves.toEqual(created.original);
    await expect(
      local.get(created.renditions[0]!.key),
    ).resolves.toEqual(created.renditions[0]!.bytes);

    const delivery = await findDeliveryFile(created.key);
    expect(delivery?.driver).toBe("local");
    expect(delivery?.remoteUrl).toBeNull();
  });
});
