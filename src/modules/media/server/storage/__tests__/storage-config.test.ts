import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createStorageDriver, storageConfigFromEnv } from "../driver";

describe("storageConfigFromEnv", () => {
  it("uses UploadThing by default", () => {
    expect(storageConfigFromEnv({})).toEqual({ driver: "uploadthing" });
  });

  it("passes the UploadThing credential to the UploadThing driver only", () => {
    expect(storageConfigFromEnv({ UPLOADTHING_TOKEN: "secret" })).toEqual({
      driver: "uploadthing",
      token: "secret",
    });
  });

  it("selects the local driver from configuration", () => {
    expect(
      storageConfigFromEnv({
        MEDIA_STORAGE_DRIVER: "local",
        MEDIA_STORAGE_LOCAL_ROOT: "/var/media",
        MEDIA_STORAGE_LOCAL_PUBLIC_URL: "/files",
        UPLOADTHING_TOKEN: "secret",
      }),
    ).toEqual({
      driver: "local",
      root: "/var/media",
      publicBaseUrl: "/files",
    });
  });

  it("rejects an unknown driver instead of silently falling back", () => {
    expect(() =>
      storageConfigFromEnv({ MEDIA_STORAGE_DRIVER: "s3" }),
    ).toThrowError(/s3/);
  });
});

describe("createStorageDriver", () => {
  it("writes through the local driver when local storage is configured", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "media-storage-config-"));

    try {
      const driver = createStorageDriver({
        driver: "local",
        root,
        publicBaseUrl: "https://cdn.example.test/media",
      });

      await driver.put("media-1/1/original", new Uint8Array([7]), "image/png");

      await expect(driver.get("media-1/1/original")).resolves.toEqual(
        new Uint8Array([7]),
      );
      await expect(driver.url("media-1/1/original")).resolves.toBe(
        "https://cdn.example.test/media/media-1/1/original",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
