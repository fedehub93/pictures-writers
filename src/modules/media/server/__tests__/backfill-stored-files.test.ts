import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { backfillStoredFiles } from "../backfill-stored-files";

describe("backfillStoredFiles", () => {
  let mediaIds: string[];

  async function createMedia(data: {
    key: string | null;
    url: string;
    storageDriver: string | null;
    mimeType?: string | null;
    size?: number | null;
    checksum?: string | null;
  }) {
    const media = await db.media.create({
      data: {
        name: `Stored file backfill ${randomUUID()}`,
        key: data.key,
        url: data.url,
        storageDriver: data.storageDriver,
        mimeType: data.mimeType ?? null,
        size: data.size ?? null,
        checksum: data.checksum ?? null,
        type: MediaType.IMAGE,
      },
    });

    mediaIds.push(media.id);
    return media;
  }

  /** A row written by the local driver: namespaced key, canonical address. */
  async function createLocalMedia() {
    const id = randomUUID();
    const key = `default/${id}/1/original`;

    return createMedia({
      key,
      url: `/media/${key}`,
      storageDriver: "local",
      mimeType: "image/webp",
      size: 1234,
      checksum: "local-checksum",
    });
  }

  /** A pre-seam row: absolute provider address and no recorded driver. */
  async function createLegacyMedia() {
    const key = `legacy-${randomUUID()}`;

    const media = await createMedia({
      key: null,
      url: `https://old-app.ufs.sh/f/${key}`,
      storageDriver: null,
      mimeType: "image/jpeg",
      size: 4321,
      checksum: "legacy-checksum",
    });

    return { media, key };
  }

  function run(ids = mediaIds) {
    return backfillStoredFiles({ mediaIds: ids });
  }

  beforeEach(() => {
    mediaIds = [];
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
  });

  it("records the location of local and absolute Media from what the library knows", async () => {
    const local = await createLocalMedia();
    const { media: legacy, key: legacyKey } = await createLegacyMedia();

    const report = await run();

    expect(report).toMatchObject({
      scanned: 2,
      created: 2,
      skipped: 0,
      failed: [],
      dryRun: false,
    });

    const localFile = await db.storedFile.findUniqueOrThrow({
      where: { mediaId: local.id },
    });
    expect(localFile).toMatchObject({
      key: local.key,
      driver: "local",
      remoteUrl: null,
      contentType: "image/webp",
      size: 1234,
      checksum: "local-checksum",
      kind: "MEDIA",
      origin: "INTERNAL",
    });

    const legacyFile = await db.storedFile.findUniqueOrThrow({
      where: { mediaId: legacy.id },
    });
    expect(legacyFile).toMatchObject({
      key: legacyKey,
      driver: "uploadthing",
      remoteUrl: legacy.url,
      contentType: "image/jpeg",
      size: 4321,
      checksum: "legacy-checksum",
      kind: "MEDIA",
      origin: "INTERNAL",
    });
  });

  it("creates exactly one record per Media when run twice", async () => {
    const local = await createLocalMedia();
    const { media: legacy } = await createLegacyMedia();

    await run();
    const second = await run();

    expect(second).toMatchObject({
      scanned: 2,
      created: 0,
      skipped: 2,
      failed: [],
    });
    await expect(
      db.storedFile.count({
        where: { mediaId: { in: [local.id, legacy.id] } },
      }),
    ).resolves.toBe(2);
  });

  it("reports a Media with no readable storage key and skips it without a record", async () => {
    const unreadable = await createMedia({
      key: null,
      url: `https://example.test/not-a-provider-address-${randomUUID()}.png`,
      storageDriver: null,
    });
    const readable = await createLocalMedia();

    const report = await run();

    expect(report).toMatchObject({
      scanned: 2,
      created: 1,
      skipped: 0,
      failed: [
        {
          mediaId: unreadable.id,
          name: unreadable.name,
          reason: "no readable storage key",
        },
      ],
    });
    await expect(
      db.storedFile.findUnique({ where: { mediaId: unreadable.id } }),
    ).resolves.toBeNull();
    await expect(
      db.storedFile.findUnique({ where: { mediaId: readable.id } }),
    ).resolves.toBeDefined();
  });

  it("changes no existing Media row", async () => {
    const local = await createLocalMedia();
    const { media: legacy } = await createLegacyMedia();
    const before = await Promise.all(
      [local.id, legacy.id].map((id) =>
        db.media.findUniqueOrThrow({ where: { id } }),
      ),
    );

    await run();

    const after = await Promise.all(
      [local.id, legacy.id].map((id) =>
        db.media.findUniqueOrThrow({ where: { id } }),
      ),
    );
    expect(after).toEqual(before);
  });

  it("writes nothing in a dry run", async () => {
    const local = await createLocalMedia();

    const report = await backfillStoredFiles({
      mediaIds: [local.id],
      dryRun: true,
    });

    expect(report).toMatchObject({
      scanned: 1,
      created: 1,
      skipped: 0,
      failed: [],
      dryRun: true,
    });
    await expect(
      db.storedFile.findUnique({ where: { mediaId: local.id } }),
    ).resolves.toBeNull();
  });

  it("skips a Media that already has a record", async () => {
    const local = await createLocalMedia();
    await db.storedFile.create({
      data: {
        key: local.key as string,
        driver: "local",
        contentType: "image/webp",
        size: 1234,
        checksum: "local-checksum",
        mediaId: local.id,
      },
    });

    const report = await run();

    expect(report).toMatchObject({
      scanned: 1,
      created: 0,
      skipped: 1,
      failed: [],
    });
    await expect(
      db.storedFile.count({ where: { mediaId: local.id } }),
    ).resolves.toBe(1);
  });
});
