import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ContentStatus, MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { auditMediaLibrary, mediaAuditExitCode } from "../media-audit";
import { checksumOf } from "../image-bytes";
import {
  formatRelinkReport,
  relinkExitCode,
  relinkMediaContent,
  type RelinkReport,
} from "../relink-content";
import { createFakeUploadThingApi } from "../storage/__tests__/fake-uploadthing";
import type { StorageEnvironment } from "../storage/driver";
import { createUploadThingStorageDriver } from "../storage/uploadthing";
import type { StorageDriver } from "../storage/types";

const UFS_URL = "https://fake-app.ufs.sh/f/";

function providerUrl(key: string): string {
  return `${UFS_URL}${key}`;
}

function bytesOf(length: number, seed = 1): Uint8Array<ArrayBuffer> {
  return Uint8Array.from({ length }, (_, index) => (index * seed) % 251);
}

async function createPatternImage(): Promise<Uint8Array<ArrayBuffer>> {
  const width = 128;
  const height = 96;
  const raw = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      raw[offset] = (x * 2) % 256;
      raw[offset + 1] = (y * 2) % 256;
      raw[offset + 2] = (x + y) % 256;
    }
  }

  const buffer = await sharp(raw, {
    raw: { width, height, channels: 3 },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

interface SeededMedia {
  mediaId: string;
  fileId: string;
  key: string;
  bytes: Uint8Array<ArrayBuffer>;
}

describe("relinkMediaContent", () => {
  let root: string;
  let env: StorageEnvironment;
  let fake: ReturnType<typeof createFakeUploadThingApi>;
  let provider: StorageDriver;
  let puts: number;
  let mediaIds: string[];
  let pageRootIds: string[];
  let postRootIds: string[];
  let preexistingMediaIds: Set<string>;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-relink-"));
    fake = createFakeUploadThingApi();
    puts = 0;

    const client = createUploadThingStorageDriver(fake.api, fake.fetch);
    provider = {
      ...client,
      put: async (key, bytes, contentType) => {
        puts += 1;
        return client.put(key, bytes, contentType);
      },
    };

    env = {
      MEDIA_STORAGE_LOCAL_ROOT: root,
      UPLOADTHING_TOKEN: "fake-token",
    };

    mediaIds = [];
    pageRootIds = [];
    postRootIds = [];
    preexistingMediaIds = new Set(
      (await db.media.findMany({ select: { id: true } })).map(
        (media) => media.id,
      ),
    );
  });

  afterEach(async () => {
    if (pageRootIds.length > 0) {
      await db.pageRoot.deleteMany({ where: { id: { in: pageRootIds } } });
    }
    if (postRootIds.length > 0) {
      await db.postRoot.deleteMany({ where: { id: { in: postRootIds } } });
    }

    const media = await db.media.findMany({ select: { id: true } });
    const created = media
      .map((entry) => entry.id)
      .filter((id) => !preexistingMediaIds.has(id));

    if (created.length > 0) {
      await db.media.deleteMany({ where: { id: { in: created } } });
    }

    await rm(root, { recursive: true, force: true });
  });

  /**
   * A Media whose stored-file record names the fake provider. `stored` is what
   * the bytes are; `checksum` defaults to those bytes but can describe
   * something else, as the backfilled library does.
   */
  async function seedMedia({
    stored,
    key = `media-${randomUUID()}`,
    checksum,
    type = MediaType.IMAGE,
    archived = false,
    createdAt,
  }: {
    stored: Uint8Array<ArrayBuffer>;
    key?: string;
    checksum?: string;
    type?: MediaType;
    archived?: boolean;
    createdAt?: Date;
  }): Promise<SeededMedia> {
    fake.putLegacyObject(key, stored, "image/png");

    const media = await db.media.create({
      data: {
        name: `Relink media ${randomUUID()}`,
        type,
        revision: 1,
        archivedAt: archived ? new Date("2026-01-01T00:00:00.000Z") : null,
        ...(createdAt ? { createdAt } : {}),
        storedFile: {
          create: {
            key,
            driver: "uploadthing",
            remoteUrl: providerUrl(key),
            contentType: "image/png",
            size: stored.byteLength,
            checksum: checksum ?? checksumOf(stored),
          },
        },
      },
      include: { storedFile: { select: { id: true } } },
    });

    mediaIds.push(media.id);

    return {
      mediaId: media.id,
      fileId: media.storedFile!.id,
      key,
      bytes: stored,
    };
  }

  /** A provider object content names but no Stored file records. */
  function seedContentObject(
    bytes: Uint8Array<ArrayBuffer>,
  ): { key: string; address: string } {
    const key = `content-${randomUUID()}`;
    fake.putLegacyObject(key, bytes, "image/png");

    return { key, address: providerUrl(key) };
  }

  async function createLivePost(tiptapBodyData: unknown): Promise<string> {
    const root = await db.postRoot.create({
      data: { slug: `relink-post-${randomUUID()}` },
    });
    postRootIds.push(root.id);

    const version = await db.postVersion.create({
      data: {
        rootId: root.id,
        version: 1,
        title: "Relink post",
        status: ContentStatus.DRAFT,
        tiptapBodyData: tiptapBodyData as PrismaJson.TipTapBodyData,
      },
      select: { id: true },
    });

    await db.postRoot.update({
      where: { id: root.id },
      data: { liveVersionId: version.id, currentVersionId: version.id },
    });

    return root.id;
  }

  async function createLivePage(puckData: unknown): Promise<string> {
    const root = await db.pageRoot.create({
      data: { slug: `relink-page-${randomUUID()}` },
    });
    pageRootIds.push(root.id);

    const version = await db.pageVersion.create({
      data: {
        rootId: root.id,
        version: 1,
        title: "Relink page",
        status: ContentStatus.DRAFT,
        puckData: puckData as PrismaJson.PuckData,
      },
      select: { id: true },
    });

    await db.pageRoot.update({
      where: { id: root.id },
      data: { liveVersionId: version.id, currentVersionId: version.id },
    });

    return root.id;
  }

  async function contentOf(postRootId: string) {
    return db.postVersion.findFirstOrThrow({
      where: { rootId: postRootId },
      select: { tiptapBodyData: true },
    });
  }

  function fieldReport(report: RelinkReport, field: string) {
    return report.fields.find((entry) => entry.field === field);
  }

  function run(
    options: { dryRun?: boolean } = {},
  ): Promise<RelinkReport> {
    return relinkMediaContent({
      ...options,
      env,
      drivers: { uploadthing: provider },
      fetchImpl: fake.fetch,
    });
  }

  it("relinks the content to the Media that already owns the bytes, writing no row", async () => {
    const bytes = bytesOf(1200);
    const media = await seedMedia({ stored: bytes });
    const object = seedContentObject(bytes);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: object.address, alt: "Cover" },
        },
      ],
    });

    const mediaBefore = await db.media.count();
    const filesBefore = await db.storedFile.count();

    const report = await run();

    expect(report).toMatchObject({
      dryRun: false,
      addresses: 1,
      relinked: 1,
      adopted: 0,
      unreachable: 0,
      ambiguous: 0,
      perceptual: 0,
      failed: 0,
    });
    expect(report.sweep).toMatchObject({ rewritten: 1, unresolved: 0 });
    expect(relinkExitCode(report)).toBe(0);

    expect(puts).toBe(0);
    expect(await db.media.count()).toBe(mediaBefore);
    expect(await db.storedFile.count()).toBe(filesBefore);

    const post = await contentOf(postRootId);
    expect(post.tiptapBodyData).toEqual({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: `/media/${media.key}`, alt: "Cover" },
        },
      ],
    });

    const second = await run();
    expect(second).toMatchObject({
      addresses: 0,
      relinked: 0,
      adopted: 0,
      unreachable: 0,
    });
  });

  it("performs the ordinary sweep when nothing is unresolved", async () => {
    const bytes = bytesOf(700, 11);
    const media = await seedMedia({ stored: bytes });
    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: providerUrl(media.key) } },
      ],
    });

    const report = await run();

    expect(report).toMatchObject({
      addresses: 0,
      relinked: 0,
      adopted: 0,
      unreachable: 0,
    });
    expect(report.sweep).toMatchObject({ rewritten: 1, unresolved: 0 });

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(
      `/media/${media.key}`,
    );
  });

  it("matches the source checksum the record carries before the checksum repair", async () => {
    // The production shape ticket 17 repairs: the record's bytes are the
    // normalised copy, its checksum describes the source content still names.
    const source = bytesOf(1000, 13);
    const stored = bytesOf(300, 17);
    const media = await seedMedia({
      stored,
      checksum: checksumOf(source),
    });
    const object = seedContentObject(source);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: object.address } },
      ],
    });

    const report = await run();

    expect(report).toMatchObject({
      addresses: 1,
      relinked: 1,
      perceptual: 0,
      adopted: 0,
      unreachable: 0,
    });

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(
      `/media/${media.key}`,
    );
  });

  it("reports each group by field and by count", async () => {
    const bytes = bytesOf(900, 3);
    const media = await seedMedia({ stored: bytes });
    const object = seedContentObject(bytes);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: object.address } },
        { type: "image", attrs: { src: object.address } },
      ],
    });
    const pageRootId = await createLivePage({
      content: [
        { type: "Image", props: { image: { src: object.address } } },
      ],
    });

    const report = await run();

    expect(fieldReport(report, "PostVersion.tiptapBodyData")).toMatchObject({
      occurrences: 2,
      relinked: 2,
      adopted: 0,
      unreachable: 0,
    });
    expect(fieldReport(report, "PageVersion.puckData")).toMatchObject({
      occurrences: 1,
      relinked: 1,
      adopted: 0,
      unreachable: 0,
    });

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).not.toContain(object.address);

    const page = await db.pageVersion.findFirstOrThrow({
      where: { rootId: pageRootId },
      select: { puckData: true },
    });
    expect(page.puckData).toEqual({
      content: [
        {
          type: "Image",
          props: { image: { src: `/media/${media.key}` } },
        },
      ],
    });
  });

  it("resolves a checksum several Media share deterministically and reports it", async () => {
    const bytes = bytesOf(1100, 5);
    const archived = await seedMedia({
      stored: bytes,
      archived: true,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const visible = await seedMedia({
      stored: bytes,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const object = seedContentObject(bytes);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: object.address } },
      ],
    });

    const report = await run();

    expect(report).toMatchObject({ relinked: 1, ambiguous: 1, adopted: 0 });
    expect(fieldReport(report, "PostVersion.tiptapBodyData")).toMatchObject({
      occurrences: 1,
      relinked: 1,
      ambiguous: 1,
    });

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(
      `/media/${visible.key}`,
    );
    expect(JSON.stringify(post.tiptapBodyData)).not.toContain(
      `/media/${archived.key}`,
    );
  });

  it("relinks a re-encoded copy perceptually instead of adopting a duplicate", async () => {
    const original = await createPatternImage();
    const reencoded = new Uint8Array(
      await sharp(original).jpeg({ quality: 60 }).toBuffer(),
    );

    // The library's bytes are the re-encode; the content names the original,
    // so no checksum matches. The picture is the same and must not be adopted.
    const media = await seedMedia({ stored: reencoded });
    const object = seedContentObject(original);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: object.address } },
      ],
    });

    const mediaBefore = await db.media.count();
    const report = await run();

    expect(report).toMatchObject({
      addresses: 1,
      relinked: 1,
      perceptual: 1,
      adopted: 0,
      unreachable: 0,
    });
    expect(await db.media.count()).toBe(mediaBefore);

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(`/media/${media.key}`);
    expect(relinkExitCode(report)).toBe(0);
  });

  it("adopts an object no Media matches, recording the provider address and moving no byte", async () => {
    const bytes = await createPatternImage();
    const object = seedContentObject(bytes);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: object.address, alt: "New" } },
      ],
    });

    const report = await run();

    expect(report).toMatchObject({
      addresses: 1,
      relinked: 0,
      adopted: 1,
      unreachable: 0,
      failed: 0,
    });
    expect(report.sweep).toMatchObject({ rewritten: 1, unresolved: 0 });
    expect(relinkExitCode(report)).toBe(0);

    // Nothing was written through a driver: the bytes stay where they are.
    expect(puts).toBe(0);
    expect(await provider.get(object.key)).toEqual(bytes);

    const adopted = await db.media.findFirstOrThrow({
      where: { storedFile: { key: object.key } },
      select: {
        id: true,
        name: true,
        type: true,
        revision: true,
        storedFile: {
          select: {
            key: true,
            driver: true,
            remoteUrl: true,
            contentType: true,
            size: true,
            checksum: true,
          },
        },
      },
    });

    expect(adopted.name.startsWith("Adopted image")).toBe(true);
    expect(adopted.type).toBe(MediaType.IMAGE);
    expect(adopted.revision).toBe(1);
    expect(adopted.storedFile).toEqual({
      key: object.key,
      driver: "uploadthing",
      remoteUrl: object.address,
      contentType: "image/png",
      size: bytes.byteLength,
      checksum: checksumOf(bytes),
    });

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(
      `/media/${object.key}`,
    );

    const audit = await auditMediaLibrary({
      env,
      localRoot: root,
      mediaIds: [adopted.id],
    });
    expect(audit.unresolved).toEqual([]);
    expect(mediaAuditExitCode(audit)).toBe(0);

    // The address now resolves through the record, so the sweep sees nothing
    // left and a second relink has no work.
    const sweep = await db.storedFile.findUnique({
      where: { key: object.key },
      select: { id: true },
    });
    expect(sweep).not.toBeNull();

    const second = await run();
    expect(second).toMatchObject({
      addresses: 0,
      adopted: 0,
      relinked: 0,
      unreachable: 0,
    });
    expect(await db.media.count({ where: { storedFile: { key: object.key } } })).toBe(1);
  });

  it("adopts one Media when two addresses name the same new object", async () => {
    const bytes = await createPatternImage();
    const first = seedContentObject(bytes);
    const second = seedContentObject(bytes);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: first.address, alt: "One" } },
        { type: "image", attrs: { src: second.address, alt: "Two" } },
      ],
    });

    const mediaBefore = await db.media.count();
    const report = await run();

    expect(report).toMatchObject({
      addresses: 2,
      adopted: 1,
      relinked: 1,
      unreachable: 0,
    });
    expect(report.sweep.unresolved).toBe(0);
    expect(await db.media.count()).toBe(mediaBefore + 1);

    // The address order is sorted, so which of the two becomes the adopted key
    // is not predetermined; exactly one of them owns the new Media.
    const adopted = await db.media.findFirstOrThrow({
      where: { storedFile: { key: { in: [first.key, second.key] } } },
      select: { storedFile: { select: { key: true } } },
    });
    expect(
      await db.storedFile.count({
        where: { key: { in: [first.key, second.key] } },
      }),
    ).toBe(1);

    const post = await contentOf(postRootId);
    const content = JSON.stringify(post.tiptapBodyData);
    expect(content).toContain(`/media/${adopted.storedFile!.key}`);
    expect(content).not.toContain(first.address);
    expect(content).not.toContain(second.address);
  });

  it("adopts one Media when two addresses name re-encoded copies of one new picture", async () => {
    const original = await createPatternImage();
    const reencoded = new Uint8Array(
      await sharp(original).jpeg({ quality: 55 }).toBuffer(),
    );
    const first = seedContentObject(original);
    const second = seedContentObject(reencoded);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: first.address } },
        { type: "image", attrs: { src: second.address } },
      ],
    });

    const mediaBefore = await db.media.count();
    const report = await run();

    expect(report).toMatchObject({
      addresses: 2,
      adopted: 1,
      relinked: 1,
      perceptual: 1,
      unreachable: 0,
    });
    expect(await db.media.count()).toBe(mediaBefore + 1);

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).not.toContain(first.address);
    expect(JSON.stringify(post.tiptapBodyData)).not.toContain(second.address);
  });

  it("reports an adoption it could not write and never points content at it", async () => {
    const bytes = await createPatternImage();
    const first = seedContentObject(bytes);
    const second = seedContentObject(bytes);

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: first.address } },
        { type: "image", attrs: { src: second.address } },
      ],
    });

    const mediaBefore = await db.media.count();

    // The fake driver makes the bytes readable; the environment has no
    // provider token, so recording the row must fail.
    const report = await relinkMediaContent({
      env: { MEDIA_STORAGE_LOCAL_ROOT: root },
      drivers: { uploadthing: provider },
      fetchImpl: fake.fetch,
    });

    expect(report).toMatchObject({
      addresses: 2,
      relinked: 0,
      adopted: 0,
      unreachable: 2,
      failed: 1,
    });
    expect(report.sweep.unresolved).toBe(2);
    expect(relinkExitCode(report)).toBe(1);
    expect(await db.media.count()).toBe(mediaBefore);

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(first.address);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(second.address);
  });

  it("reports an object the provider no longer has and leaves the content alone", async () => {
    const key = `missing-${randomUUID()}`;
    const address = providerUrl(key);
    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: address } },
      ],
    });

    const report = await run();

    expect(report).toMatchObject({
      addresses: 1,
      relinked: 0,
      adopted: 0,
      unreachable: 1,
      failed: 0,
    });
    expect(report.sweep.unresolved).toBe(1);
    expect(relinkExitCode(report)).toBe(1);

    const output = [
      ...formatRelinkReport(report),
      JSON.stringify(report),
    ].join("\n");
    expect(output).toContain("PostVersion.tiptapBodyData");
    expect(output).toContain("unreachable=1");
    expect(output).not.toContain(address);
    expect(output).not.toContain(key);

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(address);
  });

  it("reports the plan without writing on a dry run", async () => {
    const matched = bytesOf(800, 7);
    const media = await seedMedia({ stored: matched });
    const matchObject = seedContentObject(matched);
    const newObject = seedContentObject(await createPatternImage());

    const postRootId = await createLivePost({
      type: "doc",
      content: [
        { type: "image", attrs: { src: matchObject.address } },
        { type: "image", attrs: { src: newObject.address } },
      ],
    });

    const mediaBefore = await db.media.count();
    const filesBefore = await db.storedFile.count();
    const report = await run({ dryRun: true });

    expect(report).toMatchObject({
      dryRun: true,
      addresses: 2,
      relinked: 1,
      adopted: 1,
      unreachable: 0,
    });
    // The sweep was told what the run decided, so the plan is the full zero.
    expect(report.sweep).toMatchObject({ rewritten: 2, unresolved: 0 });

    expect(await db.media.count()).toBe(mediaBefore);
    expect(await db.storedFile.count()).toBe(filesBefore);
    expect(
      await db.media.count({ where: { storedFile: { key: newObject.key } } }),
    ).toBe(0);

    const post = await contentOf(postRootId);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(matchObject.address);
    expect(JSON.stringify(post.tiptapBodyData)).toContain(newObject.address);
    expect(JSON.stringify(post.tiptapBodyData)).not.toContain(`/media/${media.key}`);

    // The real run then does exactly what the dry run reported.
    const real = await run();
    expect(real).toMatchObject({ addresses: 2, relinked: 1, adopted: 1 });
    expect(real.sweep.unresolved).toBe(0);
  });
});
