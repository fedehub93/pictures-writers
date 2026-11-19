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

  async function createMedia(data: {
    id?: string;
    name?: string;
    key: string | null;
    url: string;
    storageDriver: string | null;
    size?: number | null;
    renditions?: MediaRendition[] | null;
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
      },
    });

    mediaIds.push(media.id);
    return media;
  }

  /** A row the local driver wrote: namespaced key, relative address, an object on disk. */
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
    });

    return { media, key, renditionKey };
  }

  /** A pre-seam row: no recorded driver, an absolute provider address. */
  async function createLegacyRow({ size = 500 } = {}) {
    const legacyKey = `legacy-${randomUUID()}`;

    const media = await createMedia({
      key: null,
      url: `https://legacy-app.ufs.sh/f/${legacyKey}`,
      storageDriver: null,
      size,
    });

    return { media, legacyKey };
  }

  function run(
    options: Partial<Parameters<typeof auditMediaLibrary>[0]> = {},
  ) {
    return auditMediaLibrary({ env, localRoot: root, mediaIds, ...options });
  }

  beforeEach(async () => {
    mediaIds = [];
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
    await rm(root, { recursive: true, force: true });
  });

  it("reports the driver mix, the missing object, the bytes and the exit code", async () => {
    const { media: healthyLocal } = await createLocalRow();
    const { media: healthyLegacy } = await createLegacyRow();

    // A local row whose original is accounted for but absent from the volume.
    const missingId = randomUUID();
    const missingKey = `default/${missingId}/1/original`;
    const missing = await createMedia({
      id: missingId,
      key: missingKey,
      url: `/media/${missingKey}`,
      storageDriver: "local",
      size: 700,
    });

    const before = await db.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, updatedAt: true },
      orderBy: { id: "asc" },
    });
    const filesBefore = await listFiles(root);

    const report = await run();

    expect(report).toMatchObject({
      media: 3,
      drivers: [
        { driver: "local", media: 2 },
        { driver: "unrecorded", media: 1 },
      ],
      unconfiguredDrivers: [],
      unresolved: [{ mediaId: missing.id, reason: "object-missing" }],
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
    expect(report.unresolved.some(({ mediaId }) => mediaId === healthyLocal.id)).toBe(
      false,
    );
    expect(
      report.unresolved.some(({ mediaId }) => mediaId === healthyLegacy.id),
    ).toBe(false);
    expect(mediaAuditExitCode(report)).toBe(1);

    // Read-only: neither the rows nor the volume changed.
    const after = await db.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, updatedAt: true },
      orderBy: { id: "asc" },
    });
    expect(after).toEqual(before);
    expect(await listFiles(root)).toEqual(filesBefore);
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

  it("exits 0 when every Media resolves, reporting an orphaned file without failing", async () => {
    await createLocalRow();
    await createLegacyRow();
    await driver.put("stray/orphan.bin", new Uint8Array(64), "application/octet-stream");

    const report = await run();

    expect(report.unresolved).toEqual([]);
    expect(report.bytes.localDifference).toBe(64);
    expect(report.objects).toMatchObject({ orphaned: 1, missing: 0 });
    expect(mediaAuditExitCode(report)).toBe(0);
  });

  it("reports a driver that is not configured on this instance", async () => {
    const { media } = await createLegacyRow();
    env = { MEDIA_STORAGE_LOCAL_ROOT: root };

    const report = await run();

    expect(report.drivers).toEqual([{ driver: "unrecorded", media: 1 }]);
    expect(report.unconfiguredDrivers).toEqual(["uploadthing"]);
    expect(report.unresolved).toEqual([
      { mediaId: media.id, reason: "driver-unconfigured" },
    ]);
    expect(mediaAuditExitCode(report)).toBe(1);
  });

  it("reports a recorded driver this build does not know", async () => {
    const media = await createMedia({
      key: "some-key",
      url: "https://example.test/some-key",
      storageDriver: "s3",
    });

    const report = await run();

    expect(report.drivers).toEqual([{ driver: "unknown", media: 1 }]);
    expect(report.unconfiguredDrivers).toEqual([]);
    expect(report.unresolved).toEqual([
      { mediaId: media.id, reason: "unknown-driver" },
    ]);
    expect(mediaAuditExitCode(report)).toBe(1);
  });

  it("reports a local row that records no key", async () => {
    const media = await createMedia({
      key: null,
      url: "https://example.test/no-key-here",
      storageDriver: "local",
      size: 10,
    });

    const report = await run();

    expect(report.unresolved).toEqual([
      { mediaId: media.id, reason: "no-storage-key" },
    ]);
    expect(report.bytes.localAccounted).toBe(10);
  });

  it("reports a legacy row whose address yields no key", async () => {
    const media = await createMedia({
      key: null,
      url: "https://example.test/no-key-here",
      storageDriver: null,
    });

    const report = await run();

    expect(report.unresolved).toEqual([
      { mediaId: media.id, reason: "no-storage-key" },
    ]);
  });

  it("limits the audit to the given Media ids", async () => {
    const { media: first } = await createLocalRow();
    await createLocalRow();

    const report = await run({ mediaIds: [first.id] });

    expect(report.media).toBe(1);
    expect(report.drivers).toEqual([{ driver: "local", media: 1 }]);
    expect(report.unresolved).toEqual([]);
  });
});
