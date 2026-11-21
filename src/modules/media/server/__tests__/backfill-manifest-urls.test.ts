import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { storedFilePath } from "@/modules/media/lib/file-path";
import { buildMediaDeliveryUrl } from "@/modules/media/lib/manifest";
import { mediaRenditionLocations } from "@/modules/media/lib/renditions";

import { backfillMediaManifestUrls } from "../backfill-manifest-urls";

describe("backfillMediaManifestUrls", () => {
  let mediaIds: string[];

  async function createMedia(data: {
    key: string;
    url: string;
    driver: string;
    renditions: { key: string; width: number; format: "avif" | "webp" }[];
  }) {
    const media = await db.media.create({
      data: {
        name: `Manifest backfill ${randomUUID()}`,
        type: MediaType.IMAGE,
        key: data.key,
        url: data.url,
        storageDriver: data.driver,
        revision: 1,
        renditions: data.renditions.map((rendition) => ({
          ...rendition,
          height: 400,
          bytes: 1000,
        })),
        storedFile: {
          create: {
            key: data.key,
            driver: data.driver,
            remoteUrl:
              data.driver === "local" ? null : "https://provider.test/original",
          },
        },
      },
    });

    mediaIds.push(media.id);
    return media;
  }

  function tokenUrl(
    key: string,
    renditions: { width: number; format: "avif" | "webp"; url: string }[],
  ) {
    return buildMediaDeliveryUrl(storedFilePath("MEDIA", key), {
      revision: 1,
      archived: false,
      renditions,
    });
  }

  beforeEach(() => {
    mediaIds = [];
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
  });

  it("copies a remote row's rendition addresses out of its delivery token", async () => {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const avif = `default/${id}/1/720.avif`;
    const webp = `default/${id}/1/720.webp`;

    const media = await createMedia({
      key,
      driver: "uploadthing",
      url: tokenUrl(key, [
        { width: 720, format: "avif", url: "https://provider.test/720.avif" },
        { width: 720, format: "webp", url: "https://provider.test/720.webp" },
      ]),
      renditions: [
        { key: avif, width: 720, format: "avif" },
        { key: webp, width: 720, format: "webp" },
      ],
    });

    const report = await backfillMediaManifestUrls({ mediaIds: [media.id] });

    expect(report).toMatchObject({
      scanned: 1,
      updated: 1,
      skipped: 0,
      failed: [],
      dryRun: false,
    });

    const after = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(mediaRenditionLocations(after.renditions)).toEqual([
      {
        key: avif,
        width: 720,
        height: 400,
        bytes: 1000,
        format: "avif",
        url: "https://provider.test/720.avif",
      },
      {
        key: webp,
        width: 720,
        height: 400,
        bytes: 1000,
        format: "webp",
        url: "https://provider.test/720.webp",
      },
    ]);
    expect(after.url).toBe(media.url);
  });

  it("is idempotent: a second run skips every row", async () => {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const rendition = `default/${id}/1/720.avif`;

    const media = await createMedia({
      key,
      driver: "uploadthing",
      url: tokenUrl(key, [
        { width: 720, format: "avif", url: "https://provider.test/720.avif" },
      ]),
      renditions: [{ key: rendition, width: 720, format: "avif" }],
    });

    await backfillMediaManifestUrls({ mediaIds: [media.id] });
    const second = await backfillMediaManifestUrls({ mediaIds: [media.id] });

    expect(second).toMatchObject({ updated: 0, skipped: 1, failed: [] });
  });

  it("answers a local row's renditions with their canonical path", async () => {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const rendition = `default/${id}/1/720.avif`;

    const media = await createMedia({
      key,
      driver: "local",
      url: storedFilePath("MEDIA", key),
      renditions: [{ key: rendition, width: 720, format: "avif" }],
    });

    const report = await backfillMediaManifestUrls({ mediaIds: [media.id] });

    expect(report.updated).toBe(1);

    const after = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(mediaRenditionLocations(after.renditions)[0]?.url).toBe(
      storedFilePath("MEDIA", rendition),
    );
  });

  it("reports a remote rendition the token does not address and writes nothing", async () => {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const rendition = `default/${id}/1/720.avif`;

    const media = await createMedia({
      key,
      driver: "uploadthing",
      url: storedFilePath("MEDIA", key),
      renditions: [{ key: rendition, width: 720, format: "avif" }],
    });

    const report = await backfillMediaManifestUrls({ mediaIds: [media.id] });

    expect(report.updated).toBe(0);
    expect(report.failed).toEqual([
      {
        mediaId: media.id,
        name: media.name,
        reason: "a rendition has no recorded address and the row is remote",
      },
    ]);

    const after = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(mediaRenditionLocations(after.renditions)[0]?.url).toBeUndefined();
  });

  it("writes nothing in a dry run", async () => {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const rendition = `default/${id}/1/720.avif`;

    const media = await createMedia({
      key,
      driver: "uploadthing",
      url: tokenUrl(key, [
        { width: 720, format: "avif", url: "https://provider.test/720.avif" },
      ]),
      renditions: [{ key: rendition, width: 720, format: "avif" }],
    });

    const report = await backfillMediaManifestUrls({
      mediaIds: [media.id],
      dryRun: true,
    });

    expect(report).toMatchObject({ updated: 1, dryRun: true });

    const after = await db.media.findUniqueOrThrow({ where: { id: media.id } });
    expect(mediaRenditionLocations(after.renditions)[0]?.url).toBeUndefined();
  });

  it("skips a row with no rendition manifest", async () => {
    const id = randomUUID();
    const key = `default/${id}/1/original`;

    const media = await createMedia({
      key,
      driver: "local",
      url: storedFilePath("MEDIA", key),
      renditions: [],
    });

    const report = await backfillMediaManifestUrls({ mediaIds: [media.id] });

    expect(report).toMatchObject({ updated: 0, skipped: 1, failed: [] });
  });
});
