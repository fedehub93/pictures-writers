import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { archiveMedia } from "@/modules/media/server/media-service";
import { getMediaUsageBytes } from "@/modules/media/server/media-quota";
import {
  resetStorageDriverSetting,
  setStorageDriverSetting,
} from "@/modules/media/server/__tests__/storage-setting-fixtures";

import { GET as getMedia } from "@/app/media/[...path]/route";
import { PATCH as patchSettings } from "@/app/api/settings/route";
import { POST as postMedia } from "../route";

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

async function createPng(): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width: 320,
      height: 240,
      channels: 3,
      background: { r: 120, g: 40, b: 200 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

function multipartRequest(
  bytes: Uint8Array<ArrayBuffer>,
  name: string,
  { mimeType = "image/png", fileName = `${name}.png` } = {},
): Request {
  const form = new FormData();
  form.append("file", new File([bytes], fileName, { type: mimeType }));
  form.append("name", name);

  return new Request("http://localhost/api/media", {
    method: "POST",
    body: form,
  });
}

function deliveryRequest(url: string, init?: RequestInit): Request {
  return new Request(new URL(url, "http://localhost"), {
    method: "GET",
    ...init,
  });
}

function deliveryContext(url: string) {
  return {
    params: Promise.resolve({
      path: url.split("?")[0].split("/").filter(Boolean).slice(1),
    }),
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe("the storage choice in the media library", () => {
  let root: string;
  let mediaIds: string[];
  let previousEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-storage-setting-"));
    previousEnv = {
      MEDIA_STORAGE_LOCAL_ROOT: process.env.MEDIA_STORAGE_LOCAL_ROOT,
      MEDIA_STORAGE_DRIVER: process.env.MEDIA_STORAGE_DRIVER,
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    };

    process.env.MEDIA_STORAGE_LOCAL_ROOT = root;
    // The environment still names UploadThing, so only the saved choice can
    // make the upload land on disk.
    process.env.MEDIA_STORAGE_DRIVER = "uploadthing";
    process.env.UPLOADTHING_TOKEN = "";
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }

    await resetStorageDriverSetting();
    await rm(root, { recursive: true, force: true });

    for (const [name, value] of Object.entries(previousEnv)) {
      restoreEnv(name, value);
    }
  });

  it("writes a new upload to local disk and serves it from /media/<key>", async () => {
    await setStorageDriverSetting("local");

    const original = await createPng();
    const response = await postMedia(multipartRequest(original, "Local choice"));
    const media = await response.json();

    mediaIds.push(media.id);

    expect(response.status).toBe(200);
    expect(media.storageDriver).toBe("local");
    expect(media.url).toMatch(new RegExp(`^/media/${media.key}(\\?|$)`));
    expect(media.url).not.toContain("://");

    const served = await getMedia(
      deliveryRequest(media.url),
      deliveryContext(media.url),
    );
    const bytes = new Uint8Array(await served.arrayBuffer());

    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/png");
    expect(served.headers.get("cache-control")).toContain("immutable");
    expect(served.headers.get("etag")).toBeTruthy();
    expect(bytes.byteLength).toBe(media.size);
  });

  it.each([
    ["document", "application/pdf", "guide.pdf", MediaType.FILE],
    ["audio", "audio/mpeg", "episode.mp3", MediaType.AUDIO],
    ["video", "video/mp4", "promo.mp4", MediaType.VIDEO],
  ])(
    "uploads a local %s through the same transport and serves it with Range support",
    async (_label, mimeType, fileName, expectedType) => {
      await setStorageDriverSetting("local");

      const bytes = new Uint8Array(
        Array.from({ length: 64 }, (_, index) => 65 + (index % 26)),
      );
      const response = await postMedia(
        multipartRequest(bytes, `Local ${fileName}`, { mimeType, fileName }),
      );
      const media = await response.json();
      mediaIds.push(media.id);

      expect(response.status).toBe(200);
      expect(media).toMatchObject({
        type: expectedType,
        mimeType,
        storageDriver: "local",
        size: bytes.byteLength,
      });
      expect(media.url).toBe(`/media/${media.key}`);
      expect(media.url).not.toContain("://");

      const served = await getMedia(
        deliveryRequest(media.url),
        deliveryContext(media.url),
      );

      expect(served.status).toBe(200);
      expect(served.headers.get("content-type")).toBe(mimeType);
      expect(new Uint8Array(await served.arrayBuffer())).toEqual(bytes);

      const ranged = await getMedia(
        deliveryRequest(media.url, { headers: { range: "bytes=2-9" } }),
        deliveryContext(media.url),
      );

      expect(ranged.status).toBe(206);
      expect(ranged.headers.get("content-range")).toBe(
        `bytes 2-9/${bytes.byteLength}`,
      );
      expect(new Uint8Array(await ranged.arrayBuffer())).toEqual(
        bytes.slice(2, 10),
      );
    },
  );

  it("counts a non-image's real bytes and keeps counting it once archived", async () => {
    await setStorageDriverSetting("local");

    const bytes = new Uint8Array(4096).fill(7);
    const before = await getMediaUsageBytes();

    const response = await postMedia(
      multipartRequest(bytes, "Quota document", {
        mimeType: "application/pdf",
        fileName: "quota.pdf",
      }),
    );
    const media = await response.json();
    mediaIds.push(media.id);

    expect(response.status).toBe(200);
    expect(media.size).toBe(bytes.byteLength);
    await expect(getMediaUsageBytes()).resolves.toBe(
      before + bytes.byteLength,
    );

    await archiveMedia(media.id);

    // Archiving hides the Media from the library but its bytes still occupy
    // the quota.
    await expect(getMediaUsageBytes()).resolves.toBe(
      before + bytes.byteLength,
    );
  });

  it("leaves no bytes and no row when a non-image upload is refused", async () => {
    await setStorageDriverSetting("local");

    const before = await getMediaUsageBytes();
    const unclassifiable = await postMedia(
      multipartRequest(new Uint8Array([1, 2, 3]), "Unknown type", {
        mimeType: "application/octet-stream",
        fileName: "payload.bin",
      }),
    );

    expect(unclassifiable.status).toBe(415);
    await expect(
      db.media.count({ where: { name: "Unknown type" } }),
    ).resolves.toBe(0);

    const oversized = await postMedia(
      multipartRequest(new Uint8Array(16 * 1024 * 1024 + 1), "Oversize", {
        mimeType: "application/pdf",
        fileName: "large.pdf",
      }),
    );

    expect(oversized.status).toBe(413);
    await expect(
      db.media.count({ where: { name: "Oversize" } }),
    ).resolves.toBe(0);
    await expect(getMediaUsageBytes()).resolves.toBe(before);
  });

  it("uses a choice saved through the settings API on the very next upload", async () => {
    await resetStorageDriverSetting();

    const saved = await patchSettings(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storageDriver: "local" }),
      }),
    );

    expect(saved.status).toBe(200);

    const response = await postMedia(
      multipartRequest(await createPng(), "Saved choice"),
    );
    const media = await response.json();
    mediaIds.push(media.id);

    // The environment still names UploadThing with no token: only the setting
    // saved a moment earlier can make this upload land on disk.
    expect(response.status).toBe(200);
    expect(media.storageDriver).toBe("local");
  });

  it("keeps serving Media stored before a switch from the driver on their row", async () => {
    await setStorageDriverSetting("local");

    const response = await postMedia(
      multipartRequest(await createPng(), "Stored before switch"),
    );
    const media = await response.json();
    mediaIds.push(media.id);

    // The owner now chooses UploadThing: new uploads would go there, but the
    // Media stored a second earlier must keep resolving through local disk.
    await setStorageDriverSetting("uploadthing");

    const served = await getMedia(
      deliveryRequest(media.url),
      deliveryContext(media.url),
    );

    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/png");
  });
});
