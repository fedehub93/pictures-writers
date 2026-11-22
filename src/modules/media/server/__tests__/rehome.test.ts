import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  decodeMediaManifest,
  MEDIA_MANIFEST_PARAM,
  stripMediaManifest,
} from "@/modules/media/lib/manifest";
import { storedFilePath } from "@/modules/media/lib/file-path";
import {
  mediaAddressSelect,
  mediaDeliveryAddress,
} from "@/modules/media/lib/media-address";
import { parseSrc } from "@/modules/media/lib/url";

import { auditMediaLibrary } from "../media-audit";
import { findDeliveryFile } from "../media-delivery";
import {
  planRehomeRun,
  rehomeStoredFiles,
  RehomeConfirmationRequiredError,
  RehomeDiskSpaceError,
  RehomeTargetUnconfiguredError,
} from "../rehome";
import { getActiveStorageDriverName } from "../storage";
import type { StorageEnvironment } from "../storage/driver";
import { createFakeUploadThingApi } from "../storage/__tests__/fake-uploadthing";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";
import { createUploadThingStorageDriver } from "../storage/uploadthing";
import {
  resetStorageDriverSetting,
  setStorageDriverSetting,
} from "./storage-setting-fixtures";

const UFS_URL = "https://fake-app.ufs.sh/f/";

function sha256(bytes: Uint8Array<ArrayBuffer>): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function bytesOf(length: number, seed = 1): Uint8Array<ArrayBuffer> {
  return Uint8Array.from({ length }, (_, index) => (index * seed) % 251);
}

function manifestOf(src: string) {
  return decodeMediaManifest(
    parseSrc(src).url.searchParams.get(MEDIA_MANIFEST_PARAM),
  );
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

describe("rehomeStoredFiles", () => {
  let root: string;
  let local: StorageDriver;
  let provider: StorageDriver;
  let fake: ReturnType<typeof createFakeUploadThingApi>;
  let env: StorageEnvironment;
  let reads: string[];
  let mediaIds: string[];
  let fileIds: string[];
  let standaloneFileIds: string[];
  let purgeKeys: string[];

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-rehome-"));
    local = createLocalStorageDriver({ root });
    fake = createFakeUploadThingApi();
    reads = [];

    const providerFetch = async (input: string | URL | Request) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const key = decodeURIComponent(
        new URL(url).pathname.slice("/f/".length),
      );
      reads.push(key);

      return fake.fetch(input);
    };

    provider = createUploadThingStorageDriver(fake.api, providerFetch);

    env = {
      MEDIA_STORAGE_LOCAL_ROOT: root,
      UPLOADTHING_TOKEN: "fake-token",
    };

    mediaIds = [];
    fileIds = [];
    standaloneFileIds = [];
    purgeKeys = [];

    await setStorageDriverSetting("local");
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    if (standaloneFileIds.length > 0) {
      await db.storedFile.deleteMany({
        where: { id: { in: standaloneFileIds } },
      });
    }
    if (purgeKeys.length > 0) {
      await db.storagePurgeEntry.deleteMany({
        where: { key: { in: purgeKeys } },
      });
    }

    await resetStorageDriverSetting();
    await rm(root, { recursive: true, force: true });
  });

  /** A Media whose original and renditions the fake provider holds. */
  async function createRemoteMedia({
    originalBytes = 1000,
    renditions = [{ width: 320, bytes: 200, format: "webp" as const }],
    archived = false,
  }: {
    originalBytes?: number;
    renditions?: { width: number; bytes: number; format: "avif" | "webp" }[];
    archived?: boolean;
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
        url: renditionUrl,
      });
      renditionObjects.push({
        key: renditionKey,
        bytes: renditionBytes,
        width: spec.width,
        format: spec.format,
      });
    }

    const media = await db.media.create({
      data: {
        id,
        name: `Rehome remote ${id}`,
        type: MediaType.IMAGE,
        revision: 1,
        archivedAt: archived ? new Date() : null,
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
    fileIds.push(media.storedFile!.id);
    purgeKeys.push(key, ...manifest.map((rendition) => rendition.key));

    return {
      mediaId: id,
      fileId: media.storedFile!.id,
      key,
      original,
      renditions: renditionObjects,
    };
  }

  /** A Media the local driver holds, with one rendition. */
  async function createLocalMedia(): Promise<CreatedMedia> {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const original = bytesOf(1200);
    const checksum = sha256(original);

    await local.put(key, original, "image/png");

    const renditionKey = `default/${id}/1/320.webp`;
    const renditionBytes = bytesOf(180, 7);
    await local.put(renditionKey, renditionBytes, "image/webp");

    const manifest = [
      {
        key: renditionKey,
        width: 320,
        height: 200,
        bytes: renditionBytes.byteLength,
        format: "webp" as const,
        url: storedFilePath("MEDIA", renditionKey),
      },
    ];

    const media = await db.media.create({
      data: {
        id,
        name: `Rehome local ${id}`,
        type: MediaType.IMAGE,
        revision: 1,
        renditions: manifest as PrismaJson.MediaRenditions,
        storedFile: {
          create: {
            key,
            driver: "local",
            remoteUrl: null,
            contentType: "image/png",
            size: original.byteLength,
            checksum,
          },
        },
      },
      include: { storedFile: { select: { id: true } } },
    });

    mediaIds.push(id);
    fileIds.push(media.storedFile!.id);
    purgeKeys.push(key, renditionKey);

    return {
      mediaId: id,
      fileId: media.storedFile!.id,
      key,
      original,
      renditions: [
        {
          key: renditionKey,
          bytes: renditionBytes,
          width: 320,
          format: "webp",
        },
      ],
    };
  }

  function runToLocal(overrides: Partial<Parameters<typeof rehomeStoredFiles>[0]> = {}) {
    return rehomeStoredFiles({
      target: { name: "local", driver: local },
      env,
      fileIds,
      availableDiskBytes: null,
      drivers: { uploadthing: provider },
      isSuperseded: async () => false,
      ...overrides,
    });
  }

  it("moves every object and changes no key, revision or address", async () => {
    const created = await createRemoteMedia({
      originalBytes: 1000,
      renditions: [{ width: 320, bytes: 200, format: "webp" }],
    });
    const before = await db.media.findUniqueOrThrow({
      where: { id: created.mediaId },
      select: mediaAddressSelect,
    });
    const beforeRecord = await db.storedFile.findUniqueOrThrow({
      where: { id: created.fileId },
    });
    const beforeAddress = mediaDeliveryAddress(before);

    const report = await runToLocal();

    expect(report).toMatchObject({
      target: "local",
      moved: 1,
      failed: [],
      bytesMoved: 1200,
      abandoned: 2,
      superseded: false,
      stopped: false,
    });

    const record = await db.storedFile.findUniqueOrThrow({
      where: { id: created.fileId },
    });
    expect(record).toMatchObject({
      key: created.key,
      driver: "local",
      remoteUrl: null,
      checksum: beforeRecord.checksum,
      size: 1000,
    });

    const after = await db.media.findUniqueOrThrow({
      where: { id: created.mediaId },
      select: mediaAddressSelect,
    });
    const afterAddress = mediaDeliveryAddress(after);
    expect(after.storedFile?.key).toBe(before.storedFile?.key);
    expect(after.revision).toBe(before.revision);
    expect(stripMediaManifest(afterAddress)).toBe(
      stripMediaManifest(beforeAddress),
    );

    const rendition = created.renditions[0]!;
    const manifest = manifestOf(afterAddress);
    expect(manifest?.renditions).toEqual([
      {
        width: 320,
        format: "webp",
        url: storedFilePath("MEDIA", rendition.key),
      },
    ]);

    await expect(local.get(created.key)).resolves.toEqual(created.original);
    await expect(local.get(rendition.key)).resolves.toEqual(rendition.bytes);

    const journal = await db.storagePurgeEntry.findMany({
      where: { key: { in: [created.key, rendition.key] } },
      orderBy: { key: "asc" },
    });
    expect(
      journal.map(({ driver, key }) => ({ driver, key })).sort((a, b) =>
        a.key.localeCompare(b.key),
      ),
    ).toEqual(
      [
        { driver: "uploadthing", key: created.key },
        { driver: "uploadthing", key: rendition.key },
      ].sort((a, b) => a.key.localeCompare(b.key)),
    );

    const audit = await auditMediaLibrary({
      env,
      localRoot: root,
      mediaIds: [created.mediaId],
    });
    expect(audit.unresolved).toEqual([]);
    expect(audit.drivers).toEqual([{ driver: "local", files: 1 }]);
  });

  it("resumes without recopying a file it already moved", async () => {
    const first = await createRemoteMedia({
      originalBytes: 600,
      renditions: [],
    });
    const second = await createRemoteMedia({
      originalBytes: 700,
      renditions: [],
    });

    const writes: string[] = [];
    const countingLocal: StorageDriver = {
      ...local,
      put: async (key, bytes, contentType) => {
        writes.push(key);
        await local.put(key, bytes, contentType);
      },
    };
    const target = { name: "local" as const, driver: countingLocal };

    let completed = 0;
    const firstRun = await runToLocal({
      target,
      onProgress: () => {
        completed += 1;
      },
      isSuperseded: async () => completed >= 1,
    });

    expect(firstRun).toMatchObject({
      moved: 1,
      superseded: true,
      stopped: false,
    });

    const moved = await db.storedFile.findFirstOrThrow({
      where: { id: { in: [first.fileId, second.fileId] }, driver: "local" },
    });
    const movedKey = moved.key;
    expect(writes.filter((key) => key === movedKey)).toHaveLength(1);

    const secondRun = await runToLocal({ target });

    expect(secondRun).toMatchObject({ moved: 1, superseded: false });
    expect(writes.filter((key) => key === movedKey)).toHaveLength(1);

    const remaining = await db.storedFile.count({
      where: { id: { in: fileIds }, driver: { not: "local" } },
    });
    expect(remaining).toBe(0);
  });

  it("reports a file it cannot read by id and keeps serving from its driver", async () => {
    const created = await createRemoteMedia({ renditions: [] });
    await provider.delete(created.key);

    const report = await runToLocal();

    expect(report.moved).toBe(0);
    expect(report.failed).toEqual([
      { fileId: created.fileId, reason: "unreadable" },
    ]);

    const record = await db.storedFile.findUniqueOrThrow({
      where: { id: created.fileId },
    });
    expect(record.driver).toBe("uploadthing");
    expect(record.remoteUrl).not.toBeNull();

    const delivery = await findDeliveryFile(created.key);
    expect(delivery?.driver).toBe("uploadthing");
    expect(delivery?.remoteUrl).toBe(record.remoteUrl);
  });

  it("refuses bytes that do not match the recorded checksum and touches nothing", async () => {
    const created = await createRemoteMedia({ renditions: [] });
    await provider.put(created.key, bytesOf(999, 3), "image/png");

    const report = await runToLocal();

    expect(report.failed).toEqual([
      { fileId: created.fileId, reason: "checksum-mismatch" },
    ]);

    const record = await db.storedFile.findUniqueOrThrow({
      where: { id: created.fileId },
    });
    expect(record.driver).toBe("uploadthing");
    await expect(local.get(created.key)).rejects.toThrow();
  });

  it("warns when only the headroom does not fit, and refuses when the copies do not", async () => {
    await createRemoteMedia({ originalBytes: 1000, renditions: [] });
    const target = { name: "local" as const, driver: local };

    const refusedPlan = await planRehomeRun({
      target,
      env,
      fileIds,
      availableDiskBytes: 900,
    });
    expect(refusedPlan).toMatchObject({
      level: "refused",
      blockedReason: "disk",
      bytes: 1000,
    });

    await expect(runToLocal({ plan: refusedPlan })).rejects.toBeInstanceOf(
      RehomeDiskSpaceError,
    );
    expect(reads).toEqual([]);

    const warningPlan = await planRehomeRun({
      target,
      env,
      fileIds,
      availableDiskBytes: 1050,
    });
    expect(warningPlan).toMatchObject({
      level: "warning",
      blockedReason: null,
      requiredBytes: 1100,
    });

    await expect(runToLocal({ plan: warningPlan })).rejects.toBeInstanceOf(
      RehomeConfirmationRequiredError,
    );
    expect(reads).toEqual([]);

    const report = await runToLocal({ plan: warningPlan, confirmed: true });
    expect(report.moved).toBe(1);
  });

  it("refuses a target this instance cannot reach", async () => {
    await createRemoteMedia({ renditions: [] });
    const plan = await planRehomeRun({
      target: { name: "uploadthing", driver: provider },
      env: { MEDIA_STORAGE_LOCAL_ROOT: root },
      fileIds,
    });

    expect(plan).toMatchObject({
      level: "refused",
      blockedReason: "target-unconfigured",
    });

    await expect(
      runToLocal({
        target: { name: "uploadthing", driver: provider },
        env: { MEDIA_STORAGE_LOCAL_ROOT: root },
        plan,
      }),
    ).rejects.toBeInstanceOf(RehomeTargetUnconfiguredError);
  });

  it("journals a legacy object whose key is not namespaced", async () => {
    const key = `legacy-${randomUUID()}`;
    const bytes = bytesOf(64, 5);
    const checksum = sha256(bytes);
    fake.putLegacyObject(key, bytes, "image/jpeg");

    const media = await db.media.create({
      data: {
        name: `Legacy ${key}`,
        // A pre-seam key: the flat provider key is not namespaced under the
        // Media id, so the purge can only find the object through the journal.
        type: MediaType.IMAGE,
        storedFile: {
          create: {
            key,
            driver: "uploadthing",
            remoteUrl: `${UFS_URL}${key}`,
            contentType: "image/jpeg",
            size: bytes.byteLength,
            checksum,
          },
        },
      },
      include: { storedFile: { select: { id: true } } },
    });

    mediaIds.push(media.id);
    fileIds.push(media.storedFile!.id);
    purgeKeys.push(key);

    const report = await runToLocal();

    expect(report).toMatchObject({ moved: 1, abandoned: 1 });
    await expect(local.get(key)).resolves.toEqual(bytes);

    const journal = await db.storagePurgeEntry.findMany({ where: { key } });
    expect(journal).toHaveLength(1);
    expect(journal[0]).toMatchObject({
      driver: "uploadthing",
      key,
      size: bytes.byteLength,
    });

    const after = await db.media.findUniqueOrThrow({
      where: { id: media.id },
      select: mediaAddressSelect,
    });
    expect(mediaDeliveryAddress(after)).toBe(storedFilePath("MEDIA", key));
  });

  // A re-home has no `address-not-canonical` refusal: a Media row stores no
  // address at all, only the record its delivery address is composed from.
  // Whether that record's key is canonical is the address sweep's job, and
  // running the sweep before a move is a runbook rule rather than a run guard.

  it("verifies the copy it read back from the target, not only the source", async () => {
    const created = await createRemoteMedia({ renditions: [] });

    const corrupting: StorageDriver = {
      ...local,
      put: async (key, bytes, contentType) => {
        const corrupted = Uint8Array.from(bytes);
        corrupted[0] = (corrupted[0]! + 1) % 256;
        await local.put(key, corrupted, contentType);
      },
    };

    const report = await rehomeStoredFiles({
      target: { name: "local", driver: corrupting },
      env,
      fileIds,
      availableDiskBytes: null,
      drivers: { uploadthing: provider },
      isSuperseded: async () => false,
    });

    expect(report.failed).toEqual([
      { fileId: created.fileId, reason: "checksum-mismatch" },
    ]);

    const record = await db.storedFile.findUniqueOrThrow({
      where: { id: created.fileId },
    });
    expect(record.driver).toBe("uploadthing");
    await expect(local.get(created.key)).rejects.toThrow();
  });

  it("warns about a file whose recorded size is unknown", async () => {
    const key = `default/${randomUUID()}/1/notes.bin`;
    const bytes = bytesOf(64, 9);
    const checksum = sha256(bytes);
    await provider.put(key, bytes, "application/octet-stream");

    const file = await db.storedFile.create({
      data: {
        key,
        driver: "uploadthing",
        remoteUrl: await provider.url(key),
        contentType: "application/octet-stream",
        size: null,
        checksum,
      },
    });
    standaloneFileIds.push(file.id);
    fileIds.push(file.id);
    purgeKeys.push(key);

    const plan = await planRehomeRun({
      target: { name: "local", driver: local },
      env,
      fileIds,
      availableDiskBytes: 1_000_000,
    });

    expect(plan).toMatchObject({
      files: 1,
      bytes: 0,
      unknownFiles: 1,
      level: "warning",
    });

    await expect(runToLocal({ plan })).rejects.toBeInstanceOf(
      RehomeConfirmationRequiredError,
    );

    const report = await runToLocal({ plan, confirmed: true });
    expect(report.moved).toBe(1);
    expect(
      await db.storedFile.findUniqueOrThrow({ where: { id: file.id } }),
    ).toMatchObject({ driver: "local", size: null });
  });

  it("moves back to a provider and removes the local copies without journaling them", async () => {
    const created = await createLocalMedia();

    const report = await rehomeStoredFiles({
      target: { name: "uploadthing", driver: provider },
      env,
      fileIds,
      availableDiskBytes: null,
      drivers: { local },
      isSuperseded: async () => false,
    });

    expect(report).toMatchObject({
      target: "uploadthing",
      moved: 1,
      failed: [],
      abandoned: 0,
    });

    const record = await db.storedFile.findUniqueOrThrow({
      where: { id: created.fileId },
    });
    expect(record.driver).toBe("uploadthing");
    expect(record.remoteUrl).toBe(await provider.url(created.key));

    await expect(provider.get(created.key)).resolves.toEqual(created.original);
    await expect(local.get(created.key)).rejects.toThrow();

    const journal = await db.storagePurgeEntry.count({
      where: { key: { in: [created.key, created.renditions[0]!.key] } },
    });
    expect(journal).toBe(0);

    const after = await db.media.findUniqueOrThrow({
      where: { id: created.mediaId },
      select: mediaAddressSelect,
    });
    const manifest = manifestOf(mediaDeliveryAddress(after));
    expect(manifest?.renditions[0]?.url).toBe(
      await provider.url(created.renditions[0]!.key),
    );
  });

  it("moves an attachment that has no Media role", async () => {
    const key = `default/${randomUUID()}/1/report.pdf`;
    const bytes = bytesOf(256, 11);
    const checksum = sha256(bytes);
    await provider.put(key, bytes, "application/pdf");

    const file = await db.storedFile.create({
      data: {
        key,
        driver: "uploadthing",
        remoteUrl: await provider.url(key),
        contentType: "application/pdf",
        size: bytes.byteLength,
        checksum,
        kind: "ATTACHMENT",
      },
    });
    standaloneFileIds.push(file.id);
    fileIds.push(file.id);
    purgeKeys.push(key);

    const report = await runToLocal();

    expect(report).toMatchObject({ moved: 1, abandoned: 1 });
    const moved = await db.storedFile.findUniqueOrThrow({
      where: { id: file.id },
    });
    expect(moved).toMatchObject({
      key,
      driver: "local",
      remoteUrl: null,
      contentType: "application/pdf",
    });
    await expect(local.get(key)).resolves.toEqual(bytes);
  });

  it("supersedes the run when the active driver changes, and the next run converges", async () => {
    const first = await createRemoteMedia({ originalBytes: 600, renditions: [] });
    const second = await createRemoteMedia({ originalBytes: 700, renditions: [] });

    let checks = 0;
    const firstRun = await runToLocal({
      isSuperseded: async () => {
        checks += 1;
        if (checks === 2) await setStorageDriverSetting("uploadthing");

        return (await getActiveStorageDriverName(env)) !== "local";
      },
    });

    expect(firstRun).toMatchObject({ moved: 1, superseded: true });
    expect(
      await db.storedFile.count({
        where: { id: { in: [first.fileId, second.fileId] }, driver: "local" },
      }),
    ).toBe(1);

    await setStorageDriverSetting("local");
    const secondRun = await runToLocal({ isSuperseded: async () => false });

    expect(secondRun).toMatchObject({ moved: 1, superseded: false });
    expect(
      await db.storedFile.count({
        where: { id: { in: [first.fileId, second.fileId] }, driver: "local" },
      }),
    ).toBe(2);
  });

  it("stops at a file boundary and leaves the rest for the next run", async () => {
    await createRemoteMedia({ originalBytes: 600, renditions: [] });
    await createRemoteMedia({ originalBytes: 700, renditions: [] });

    const controller = new AbortController();
    let completed = 0;

    const report = await runToLocal({
      signal: controller.signal,
      onProgress: () => {
        completed += 1;
        controller.abort();
      },
    });

    expect(completed).toBe(1);
    expect(report).toMatchObject({ moved: 1, stopped: true, superseded: false });
    expect(
      await db.storedFile.count({
        where: { id: { in: fileIds }, driver: "local" },
      }),
    ).toBe(1);
  });
});
