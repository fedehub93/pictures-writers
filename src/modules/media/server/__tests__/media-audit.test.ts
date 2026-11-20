import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { MediaRendition } from "@/modules/media/types";

import {
  auditMediaLibrary,
  formatMediaAuditReport,
  mediaAuditExitCode,
} from "../media-audit";
import type { StorageEnvironment } from "../storage/driver";
import { createLocalStorageDriver } from "../storage/local";
import type { StorageDriver } from "../storage/types";

async function listFiles(root: string, directory = root): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

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

describe("auditMediaLibrary", () => {
  let root: string;
  let driver: StorageDriver;
  let env: StorageEnvironment;
  let mediaIds: string[];
  let standaloneFileIds: string[];

  async function createMedia(data: {
    id?: string;
    name?: string;
    key: string | null;
    url: string;
    storageDriver: string | null;
    size?: number | null;
    renditions?: MediaRendition[] | null;
    /** The stored-file record; omit to cover a row that predates the backfill. */
    file?: {
      key: string;
      driver: string;
      size?: number | null;
      contentType?: string | null;
    };
  }) {
    const media = await db.media.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        name: data.name ?? `Audit media ${randomUUID()}`,
        key: data.key,
        url: data.url,
        type: MediaType.IMAGE,
        size: data.size ?? null,
        storageDriver: data.storageDriver,
        renditions: data.renditions
          ? (data.renditions as PrismaJson.MediaRenditions)
          : null,
        ...(data.file
          ? {
              storedFile: {
                create: {
                  key: data.file.key,
                  driver: data.file.driver,
                  size: data.file.size ?? data.size ?? null,
                  contentType: data.file.contentType ?? null,
                },
              },
            }
          : {}),
      },
    });

    mediaIds.push(media.id);
    return media;
  }

  async function storedFileIdFor(mediaId: string): Promise<string> {
    const file = await db.storedFile.findUniqueOrThrow({ where: { mediaId } });
    return file.id;
  }

  /** A Media the local driver wrote: namespaced key, relative address, an object on disk. */
  async function createLocalRow({
    originalBytes = 1000,
    renditionBytes = 400,
  }: {
    originalBytes?: number;
    renditionBytes?: number;
  } = {}) {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const renditionKey = `default/${id}/1/720.avif`;

    await driver.put(key, new Uint8Array(originalBytes), "image/png");
    await driver.put(renditionKey, new Uint8Array(renditionBytes), "image/avif");

    const media = await createMedia({
      id,
      key,
      url: `/media/${key}`,
      storageDriver: "local",
      size: originalBytes,
      renditions: [
        {
          key: renditionKey,
          width: 720,
          height: 480,
          bytes: renditionBytes,
          format: "avif",
        },
      ],
      file: {
        key,
        driver: "local",
        size: originalBytes,
        contentType: "image/png",
      },
    });

    return { media, key, renditionKey };
  }

  /** A pre-seam Media: a flat provider key, an absolute address, a recorded driver. */
  async function createLegacyRow({ size = 500 } = {}) {
    const legacyKey = `legacy-${randomUUID()}`;

    const media = await createMedia({
      key: null,
      url: `https://legacy-app.ufs.sh/f/${legacyKey}`,
      storageDriver: null,
      size,
      file: {
        key: legacyKey,
        driver: "uploadthing",
        size,
        contentType: "image/jpeg",
      },
    });

    return { media, legacyKey };
  }

  function run(
    options: Partial<Parameters<typeof auditMediaLibrary>[0]> = {},
  ) {
    return auditMediaLibrary({
      env,
      localRoot: root,
      ...(mediaIds.length > 0 ? { mediaIds } : {}),
      ...options,
    });
  }

  beforeEach(async () => {
    mediaIds = [];
    standaloneFileIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-audit-"));
    driver = createLocalStorageDriver({ root });
    env = {
      MEDIA_STORAGE_LOCAL_ROOT: root,
      UPLOADTHING_TOKEN: "fake-token",
    };
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
    await rm(root, { recursive: true, force: true });
  });

  it("reports the driver mix, the missing object, the bytes and the exit code", async () => {
    const { media: healthyLocal } = await createLocalRow();
    const { media: healthyLegacy } = await createLegacyRow();

    // A local file whose original is accounted for but absent from the volume.
    const missingId = randomUUID();
    const missingKey = `default/${missingId}/1/original`;
    const missing = await createMedia({
      id: missingId,
      key: missingKey,
      url: `/media/${missingKey}`,
      storageDriver: "local",
      size: 700,
      file: { key: missingKey, driver: "local", size: 700 },
    });
    const missingFileId = await storedFileIdFor(missing.id);
    const healthyLocalFileId = await storedFileIdFor(healthyLocal.id);
    const healthyLegacyFileId = await storedFileIdFor(healthyLegacy.id);

    const mediaBefore = await db.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, updatedAt: true },
      orderBy: { id: "asc" },
    });
    const filesBefore = await db.storedFile.findMany({
      where: { mediaId: { in: mediaIds } },
      select: { id: true, updatedAt: true },
      orderBy: { id: "asc" },
    });
    const volumeBefore = await listFiles(root);

    const report = await run();

    expect(report).toMatchObject({
      files: 3,
      drivers: [
        { driver: "local", files: 2 },
        { driver: "uploadthing", files: 1 },
      ],
      configuredDrivers: ["local", "uploadthing"],
      unconfiguredDrivers: [],
      unresolved: [{ id: missingFileId, reason: "object-missing" }],
      bytes: {
        accounted: 1000 + 400 + 500 + 700,
        localAccounted: 1000 + 400 + 700,
        localOnDisk: 1000 + 400,
        localDifference: -700,
      },
      objects: {
        accounted: 3,
        onDisk: 2,
        missing: 1,
        orphaned: 0,
      },
    });
    expect(
      report.unresolved.some(({ id }) => id === healthyLocalFileId),
    ).toBe(false);
    expect(
      report.unresolved.some(({ id }) => id === healthyLegacyFileId),
    ).toBe(false);
    expect(mediaAuditExitCode(report)).toBe(1);

    const lines = formatMediaAuditReport(report);
    expect(lines).toContain("configured drivers: local uploadthing");
    expect(lines).toContain(`  ${missingFileId} object-missing`);

    // Read-only: neither the rows, the records nor the volume changed.
    const mediaAfter = await db.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, updatedAt: true },
      orderBy: { id: "asc" },
    });
    const filesAfter = await db.storedFile.findMany({
      where: { mediaId: { in: mediaIds } },
      select: { id: true, updatedAt: true },
      orderBy: { id: "asc" },
    });
    expect(mediaAfter).toEqual(mediaBefore);
    expect(filesAfter).toEqual(filesBefore);
    expect(await listFiles(root)).toEqual(volumeBefore);
  });

  it("reads the stored-file record instead of the Media's storage columns", async () => {
    const id = randomUUID();
    const recordKey = `default/${id}/1/original`;
    await driver.put(recordKey, new Uint8Array(900), "image/png");

    const media = await createMedia({
      id,
      key: `stale-${randomUUID()}`,
      url: `/media/stale`,
      storageDriver: "uploadthing",
      size: 999_999,
      file: { key: recordKey, driver: "local", size: 900 },
    });

    const report = await run();

    expect(report.files).toBe(1);
    expect(report.drivers).toEqual([{ driver: "local", files: 1 }]);
    expect(report.unresolved).toEqual([]);
    expect(report.bytes).toMatchObject({
      accounted: 900,
      localAccounted: 900,
      localOnDisk: 900,
      localDifference: 0,
    });
    expect(report.objects).toMatchObject({
      accounted: 1,
      onDisk: 1,
      missing: 0,
      orphaned: 0,
    });
    expect(media.id).toBe(id);
  });

  it("counts a stored file that has no Media role", async () => {
    const key = `files/attachment-${randomUUID()}.bin`;
    await driver.put(key, new Uint8Array(200), "application/pdf");

    const file = await db.storedFile.create({
      data: {
        key,
        driver: "local",
        size: 200,
        contentType: "application/pdf",
      },
    });
    standaloneFileIds.push(file.id);

    const report = await run();

    expect(report.files).toBe(1);
    expect(report.drivers).toEqual([{ driver: "local", files: 1 }]);
    expect(report.unresolved).toEqual([]);
    expect(report.bytes).toMatchObject({
      accounted: 200,
      localAccounted: 200,
      localOnDisk: 200,
      localDifference: 0,
    });
    expect(report.objects).toMatchObject({
      accounted: 1,
      onDisk: 1,
      missing: 0,
      orphaned: 0,
    });
    expect(mediaAuditExitCode(report)).toBe(0);
  });

  it("reports a stored file whose recorded driver is not configured and keeps going", async () => {
    env = { MEDIA_STORAGE_LOCAL_ROOT: root };

    const local = await createLocalRow();
    const remote = await createMedia({
      key: `legacy-${randomUUID()}`,
      url: "https://legacy-app.ufs.sh/f/legacy-key",
      storageDriver: null,
      size: 500,
      file: {
        key: `legacy-${randomUUID()}`,
        driver: "uploadthing",
        size: 500,
      },
    });
    const remoteFileId = await storedFileIdFor(remote.id);
    const localFileId = await storedFileIdFor(local.media.id);

    const report = await run();

    expect(report.drivers).toEqual([
      { driver: "local", files: 1 },
      { driver: "uploadthing", files: 1 },
    ]);
    expect(report.configuredDrivers).toEqual(["local"]);
    expect(report.unconfiguredDrivers).toEqual(["uploadthing"]);
    expect(report.unresolved).toEqual([
      { id: remoteFileId, reason: "driver-unconfigured" },
    ]);
    expect(
      report.unresolved.some(({ id }) => id === localFileId),
    ).toBe(false);
    expect(mediaAuditExitCode(report)).toBe(1);
  });

  it("reports a record whose driver this build does not know", async () => {
    const media = await createMedia({
      key: "some-key",
      url: "https://example.test/some-key",
      storageDriver: null,
      file: { key: "some-key", driver: "s3" },
    });
    const fileId = await storedFileIdFor(media.id);

    const report = await run();

    expect(report.drivers).toEqual([{ driver: "unknown", files: 1 }]);
    expect(report.unconfiguredDrivers).toEqual([]);
    expect(report.unresolved).toEqual([
      { id: fileId, reason: "unknown-driver" },
    ]);
    expect(mediaAuditExitCode(report)).toBe(1);
  });

  it("reports a stored file that records no key", async () => {
    const media = await createMedia({
      key: null,
      url: "https://example.test/no-key-here",
      storageDriver: "local",
      size: 10,
      file: { key: "", driver: "local", size: 10 },
    });
    const fileId = await storedFileIdFor(media.id);

    const report = await run();

    expect(report.unresolved).toEqual([
      { id: fileId, reason: "no-storage-key" },
    ]);
    expect(report.bytes.accounted).toBe(10);
    expect(report.bytes.localAccounted).toBe(10);
    expect(report.objects.accounted).toBe(0);
  });

  it("reports a Media with no stored-file record and accounts nothing for it", async () => {
    const media = await createMedia({
      key: `legacy-${randomUUID()}`,
      url: "https://example.test/no-key-here",
      storageDriver: null,
      size: 10,
    });

    const report = await run();

    expect(report.files).toBe(0);
    expect(report.drivers).toEqual([]);
    expect(report.unresolved).toEqual([
      { id: media.id, reason: "no-stored-file" },
    ]);
    expect(report.bytes.accounted).toBe(0);
    expect(mediaAuditExitCode(report)).toBe(1);
  });

  it("keeps storage keys, addresses and names out of its output", async () => {
    const name = "Secret Cover Photo";
    const { key, renditionKey } = await createLocalRow();

    // Unresolved, so its id is printed; its name, key and address must not be.
    const namedId = randomUUID();
    const namedKey = `default/${namedId}/1/original`;
    const named = await createMedia({
      id: namedId,
      name,
      key: namedKey,
      url: `/media/${namedKey}`,
      storageDriver: "local",
      size: 10,
    });
    await createMedia({
      name: `${name} legacy`,
      key: null,
      url: "https://legacy-app.ufs.sh/f/private-address",
      storageDriver: null,
    });

    const report = await run();
    const output = [
      ...formatMediaAuditReport(report),
      JSON.stringify(report),
    ].join("\n");

    expect(output).toContain(named.id);
    expect(output).not.toContain(key);
    expect(output).not.toContain(renditionKey);
    expect(output).not.toContain(namedKey);
    expect(output).not.toContain("private-address");
    expect(output).not.toContain("ufs.sh");
    expect(output).not.toContain(name);
    expect(output).not.toContain("/media/");
  });

  it("exits 0 when every stored file resolves, reporting an orphaned file without failing", async () => {
    await createLocalRow();
    await createLegacyRow();
    await driver.put("stray/orphan.bin", new Uint8Array(64), "application/octet-stream");

    const report = await run();

    expect(report.unresolved).toEqual([]);
    expect(report.bytes.localDifference).toBe(64);
    expect(report.objects).toMatchObject({ orphaned: 1, missing: 0 });
    expect(mediaAuditExitCode(report)).toBe(0);
  });

  it("limits the audit to files owned by the given Media ids", async () => {
    const { media: first } = await createLocalRow();
    await createLocalRow();

    const report = await run({ mediaIds: [first.id] });

    expect(report.files).toBe(1);
    expect(report.drivers).toEqual([{ driver: "local", files: 1 }]);
    expect(report.unresolved).toEqual([]);
  });
});
