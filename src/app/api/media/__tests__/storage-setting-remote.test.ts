import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import {
  StorageObjectNotFoundError,
  type StorageDriver,
} from "@/modules/media/server/storage/types";
import {
  createUploadThingStorageDriver,
  type UploadThingApi,
} from "@/modules/media/server/storage/uploadthing";
import {
  resetStorageDriverSetting,
  setStorageDriverSetting,
} from "@/modules/media/server/__tests__/storage-setting-fixtures";

import { GET as getMedia } from "@/app/media/[...path]/route";
import { POST as postReplaceMedia } from "@/app/api/media/[mediaId]/replace/route";
import { POST as postMedia } from "../route";

const uploadThing = vi.hoisted(() => ({
  fake: undefined as
    | {
        api: UploadThingApi;
        fetch: typeof fetch;
        putLegacyObject: (
          key: string,
          bytes: Uint8Array<ArrayBuffer>,
          contentType: string,
        ) => void;
      }
    | undefined,
}));

// The production factory builds a real UTApi, so the fake is injected at the
// same seam the storage contract suite uses: the UploadThing client itself.
vi.mock("uploadthing/server", async () => {
  const { createFakeUploadThingApi } = await import(
    "@/modules/media/server/storage/__tests__/fake-uploadthing"
  );
  const fake = createFakeUploadThingApi();
  uploadThing.fake = fake;

  return {
    UTApi: class {
      uploadFiles = fake.api.uploadFiles;
      deleteFiles = fake.api.deleteFiles;
      getFileUrls = fake.api.getFileUrls;
      listFiles = fake.api.listFiles;
    },
  };
});

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

async function createPng(): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: {
      width: 240,
      height: 160,
      channels: 3,
      background: { r: 20, g: 140, b: 90 },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(buffer);
}

function multipartRequest(bytes: Uint8Array<ArrayBuffer>, name: string): Request {
  const form = new FormData();
  form.append("file", new File([bytes], `${name}.png`, { type: "image/png" }));
  form.append("name", name);

  return new Request("http://localhost/api/media", {
    method: "POST",
    body: form,
  });
}

function deliveryRequest(url: string): Request {
  return new Request(new URL(url, "http://localhost"), { method: "GET" });
}

function replacementRequest(bytes: Uint8Array<ArrayBuffer>): Request {
  const form = new FormData();
  form.append("file", new File([bytes], "replacement.png", { type: "image/png" }));

  return new Request("http://localhost/api/media/media-id/replace", {
    method: "POST",
    body: form,
  });
}

function replaceContext(mediaId: string) {
  return { params: Promise.resolve({ mediaId }) };
}

async function remoteCustomIds(): Promise<string[]> {
  const page = await uploadThing.fake!.api.listFiles({ limit: 1000, offset: 0 });

  return page.files
    .map((file) => file.customId)
    .filter((customId): customId is string => Boolean(customId));
}

function deliveryContext(url: string) {
  return {
    params: Promise.resolve({
      path: url.split("?")[0].split("/").filter(Boolean).slice(1),
    }),
  };
}

describe("choosing UploadThing for new uploads", () => {
  let root: string;
  let mediaIds: string[];
  let previousEnv: Record<string, string | undefined>;

  beforeAll(() => {
    if (!uploadThing.fake) {
      throw new Error("The fake UploadThing client was not installed.");
    }
    vi.stubGlobal("fetch", uploadThing.fake.fetch);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    mediaIds = [];
    root = await mkdtemp(path.join(tmpdir(), "media-remote-setting-"));
    previousEnv = {
      MEDIA_STORAGE_DRIVER: process.env.MEDIA_STORAGE_DRIVER,
      MEDIA_STORAGE_LOCAL_ROOT: process.env.MEDIA_STORAGE_LOCAL_ROOT,
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    };

    delete process.env.MEDIA_STORAGE_DRIVER;
    process.env.MEDIA_STORAGE_LOCAL_ROOT = root;
    process.env.UPLOADTHING_TOKEN = "fake-token";

    await setStorageDriverSetting("uploadthing");
  });

  afterEach(async () => {
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }

    await resetStorageDriverSetting();
    await rm(root, { recursive: true, force: true });

    for (const [name, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  it("sends the next upload to UploadThing and redirects its canonical URL", async () => {
    const response = await postMedia(
      multipartRequest(await createPng(), "Remote choice"),
    );
    const media = await response.json();
    mediaIds.push(media.id);

    expect(response.status).toBe(200);
    expect(media.storageDriver).toBe("uploadthing");
    expect(media.key).toBe(`default/${media.id}/1/original`);
    expect(media.url).toMatch(new RegExp(`^/media/${media.key}(\\?|$)`));

    const file = await db.storedFile.findUniqueOrThrow({
      where: { mediaId: media.id },
    });
    expect(file).toMatchObject({
      key: media.key,
      driver: "uploadthing",
      contentType: "image/png",
      size: media.size,
      checksum: media.checksum,
      kind: "MEDIA",
      origin: "INTERNAL",
    });
    expect(file.remoteUrl).toMatch(/^https:\/\/fake-app\.ufs\.sh\/f\//);

    const served = await getMedia(
      deliveryRequest(media.url),
      deliveryContext(media.url),
    );

    expect(served.status).toBe(302);
    expect(served.headers.get("location")).toMatch(
      /^https:\/\/fake-app\.ufs\.sh\/f\//,
    );
    expect(served.headers.get("cache-control")).toContain("immutable");
  });

  it("replaces a remote Media through the active provider and cleans the previous revision", async () => {
    const created = await postMedia(
      multipartRequest(await createPng(), "Remote before"),
    );
    const media = await created.json();
    mediaIds.push(media.id);

    const response = await postReplaceMedia(
      replacementRequest(await createPng()),
      replaceContext(media.id),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.previousRevisionCleanup).toBe("removed");
    expect(body.media).toMatchObject({
      id: media.id,
      revision: 2,
      storageDriver: "uploadthing",
      key: `default/${media.id}/2/original`,
    });

    const customIds = await remoteCustomIds();
    expect(
      customIds.some((customId) =>
        customId.startsWith(`default/${media.id}/2/`),
      ),
    ).toBe(true);
    expect(
      customIds.some((customId) =>
        customId.startsWith(`default/${media.id}/1/`),
      ),
    ).toBe(false);

    const served = await getMedia(
      deliveryRequest(body.media.url),
      deliveryContext(body.media.url),
    );
    expect(served.status).toBe(302);
    expect(served.headers.get("location")).toMatch(
      /^https:\/\/fake-app\.ufs\.sh\/f\//,
    );
  });

  it("cleans a legacy provider object by its file key when replacing", async () => {
    const legacyKey = "legacy-provider-original";
    const legacyBytes = new Uint8Array([3, 1, 4, 1, 5]);
    uploadThing.fake!.putLegacyObject(legacyKey, legacyBytes, "image/png");

    const mediaId = randomUUID();
    const legacy = await db.media.create({
      data: {
        id: mediaId,
        name: "Pre-seam provider image",
        key: legacyKey,
        url: `https://fake-app.ufs.sh/f/${legacyKey}`,
        size: legacyBytes.byteLength,
        type: MediaType.IMAGE,
        mimeType: "image/png",
        revision: 1,
        storageDriver: null,
      },
    });
    mediaIds.push(legacy.id);

    const response = await postReplaceMedia(
      replacementRequest(await createPng()),
      replaceContext(mediaId),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.previousRevisionCleanup).toBe("removed");
    expect(body.media).toMatchObject({
      id: mediaId,
      revision: 2,
      storageDriver: "uploadthing",
    });

    // A pre-seam row records the provider's file key rather than a customId, so
    // cleanup has to address it by that key.
    const remote = createUploadThingStorageDriver(
      uploadThing.fake!.api,
      uploadThing.fake!.fetch,
    );
    await expect(remote.get(legacyKey)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("replaces a remote Media with local active and serves the new revision from disk", async () => {
    await setStorageDriverSetting("uploadthing");

    const created = await postMedia(
      multipartRequest(await createPng(), "Remote before the switch"),
    );
    const media = await created.json();
    mediaIds.push(media.id);

    await setStorageDriverSetting("local");

    const response = await postReplaceMedia(
      replacementRequest(await createPng()),
      replaceContext(media.id),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.previousRevisionCleanup).toBe("removed");
    expect(body.media).toMatchObject({
      id: media.id,
      revision: 2,
      storageDriver: "local",
      key: `default/${media.id}/2/original`,
    });
    expect(
      body.media.url.startsWith(`/media/${body.media.key}`),
    ).toBe(true);
    expect(body.media.url).not.toContain("://");

    const localDriver: StorageDriver = createLocalStorageDriver({ root });
    await expect(localDriver.get(body.media.key)).resolves.toBeDefined();

    // The previous revision lived on the provider: cleanup resolved the
    // recorded driver rather than the newly active one.
    const customIds = await remoteCustomIds();
    expect(
      customIds.some((customId) =>
        customId.startsWith(`default/${media.id}/1/`),
      ),
    ).toBe(false);

    const served = await getMedia(
      deliveryRequest(body.media.url),
      deliveryContext(body.media.url),
    );
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/png");
  });

  it("replaces a local Media with UploadThing active and cleans the local revision", async () => {
    await setStorageDriverSetting("local");

    const created = await postMedia(
      multipartRequest(await createPng(), "Local before the switch"),
    );
    const media = await created.json();
    mediaIds.push(media.id);

    const localDriver: StorageDriver = createLocalStorageDriver({ root });
    const before = await db.media.findUniqueOrThrow({
      where: { id: media.id },
    });

    await setStorageDriverSetting("uploadthing");

    const response = await postReplaceMedia(
      replacementRequest(await createPng()),
      replaceContext(media.id),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.previousRevisionCleanup).toBe("removed");
    expect(body.media).toMatchObject({
      id: media.id,
      revision: 2,
      storageDriver: "uploadthing",
      key: `default/${media.id}/2/original`,
    });

    await expect(localDriver.get(before.key!)).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
    expect(
      (await remoteCustomIds()).some((customId) =>
        customId.startsWith(`default/${media.id}/2/`),
      ),
    ).toBe(true);

    const served = await getMedia(
      deliveryRequest(body.media.url),
      deliveryContext(body.media.url),
    );
    expect(served.status).toBe(302);
  });
});
