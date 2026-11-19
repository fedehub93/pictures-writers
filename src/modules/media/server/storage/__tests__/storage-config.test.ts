import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  createStorageDriver,
  driverForStorageDriver,
  isUploadThingConfigured,
  storageConfigFromEnv,
  storageDriverNameFromSetting,
} from "../driver";

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
        UPLOADTHING_TOKEN: "secret",
      }),
    ).toEqual({
      driver: "local",
      root: "/var/media",
    });
  });

  it("ignores a leftover local public prefix", () => {
    expect(
      storageConfigFromEnv({
        MEDIA_STORAGE_DRIVER: "local",
        MEDIA_STORAGE_LOCAL_ROOT: "/var/media",
        MEDIA_STORAGE_LOCAL_PUBLIC_URL: "/files",
      }),
    ).toEqual({
      driver: "local",
      root: "/var/media",
    });
  });

  it("rejects an unknown driver instead of silently falling back", () => {
    expect(() =>
      storageConfigFromEnv({ MEDIA_STORAGE_DRIVER: "s3" }),
    ).toThrowError(/s3/);
  });
});

describe("storageDriverNameFromSetting", () => {
  it("lets the saved setting win over the environment", () => {
    expect(
      storageDriverNameFromSetting("local", {
        MEDIA_STORAGE_DRIVER: "uploadthing",
      }),
    ).toBe("local");
    expect(
      storageDriverNameFromSetting("uploadthing", {
        MEDIA_STORAGE_DRIVER: "local",
      }),
    ).toBe("uploadthing");
  });

  it("falls back to the environment when no setting was saved", () => {
    expect(
      storageDriverNameFromSetting(null, { MEDIA_STORAGE_DRIVER: "local" }),
    ).toBe("local");
  });

  it("keeps today's driver when neither the setting nor the environment names one", () => {
    expect(storageDriverNameFromSetting(undefined, {})).toBe("uploadthing");
  });

  it("ignores a stored value the application does not know", () => {
    expect(
      storageDriverNameFromSetting("s3", { MEDIA_STORAGE_DRIVER: "local" }),
    ).toBe("local");
  });
});

describe("isUploadThingConfigured", () => {
  it("is available only while a token is configured", () => {
    expect(isUploadThingConfigured({ UPLOADTHING_TOKEN: "secret" })).toBe(true);
    expect(isUploadThingConfigured({ UPLOADTHING_TOKEN: "  " })).toBe(false);
    expect(isUploadThingConfigured({})).toBe(false);
  });
});

describe("createStorageDriver", () => {
  it("writes through the local driver when local storage is configured", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "media-storage-config-"));

    try {
      const driver = createStorageDriver({
        driver: "local",
        root,
      });

      await driver.put("media-1/1/original", new Uint8Array([7]), "image/png");

      await expect(driver.get("media-1/1/original")).resolves.toEqual(
        new Uint8Array([7]),
      );
      await expect(driver.url("media-1/1/original")).resolves.toBe(
        "/media/media-1/1/original",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("composes the canonical address when a leftover public prefix is set", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "media-storage-config-"));

    try {
      const driver = driverForStorageDriver("local", {
        MEDIA_STORAGE_LOCAL_ROOT: root,
        MEDIA_STORAGE_LOCAL_PUBLIC_URL: "/files",
      });

      await driver.put("media-1/1/original", new Uint8Array([7]), "image/png");

      await expect(driver.url("media-1/1/original")).resolves.toBe(
        "/media/media-1/1/original",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
