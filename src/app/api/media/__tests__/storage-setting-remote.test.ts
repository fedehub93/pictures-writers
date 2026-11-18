import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";
import {
  resetStorageDriverSetting,
  setStorageDriverSetting,
} from "@/modules/media/server/__tests__/storage-setting-fixtures";

import { GET as getMedia } from "@/app/media/[...path]/route";
import { POST as postMedia } from "../route";

const uploadThing = vi.hoisted(() => ({
  fake: undefined as
    | {
        api: {
          uploadFiles: unknown;
          deleteFiles: unknown;
          getFileUrls: unknown;
          listFiles: unknown;
        };
        fetch: typeof fetch;
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
});
