import { afterEach, describe, expect, it } from "vitest";

import {
  resetStorageDriverSetting,
  setStorageDriverSetting,
} from "@/modules/media/server/__tests__/storage-setting-fixtures";

import {
  getStorageDriverChoice,
  resolveActiveStorageDriver,
} from "../active";

afterEach(async () => {
  await resetStorageDriverSetting();
});

describe("resolveActiveStorageDriver", () => {
  it("uses the saved setting over the environment", async () => {
    await setStorageDriverSetting("local");

    const resolved = await resolveActiveStorageDriver({
      MEDIA_STORAGE_DRIVER: "uploadthing",
      MEDIA_STORAGE_LOCAL_ROOT: "/tmp/media",
    });

    expect(resolved.name).toBe("local");
  });

  it("uses the environment when the owner never touched the setting", async () => {
    await setStorageDriverSetting(null);

    const resolved = await resolveActiveStorageDriver({
      MEDIA_STORAGE_DRIVER: "local",
      MEDIA_STORAGE_LOCAL_ROOT: "/tmp/media",
    });

    expect(resolved.name).toBe("local");
  });

  it("keeps today's driver when neither the setting nor the environment names one", async () => {
    await setStorageDriverSetting(null);

    const resolved = await resolveActiveStorageDriver({});

    expect(resolved.name).toBe("uploadthing");
  });

  it("picks up a saved choice on the next resolution, without a restart", async () => {
    await setStorageDriverSetting(null);

    await expect(resolveActiveStorageDriver({})).resolves.toMatchObject({
      name: "uploadthing",
    });

    await setStorageDriverSetting("local");

    await expect(
      resolveActiveStorageDriver({ MEDIA_STORAGE_LOCAL_ROOT: "/tmp/media" }),
    ).resolves.toMatchObject({ name: "local" });
  });
});

describe("getStorageDriverChoice", () => {
  it("reports UploadThing unavailable while no token is configured", async () => {
    await setStorageDriverSetting(null);

    await expect(getStorageDriverChoice({})).resolves.toEqual({
      active: "uploadthing",
      uploadThingAvailable: false,
    });
  });

  it("reports UploadThing available once a token is configured", async () => {
    await setStorageDriverSetting("local");

    await expect(
      getStorageDriverChoice({ UPLOADTHING_TOKEN: "secret" }),
    ).resolves.toEqual({ active: "local", uploadThingAvailable: true });
  });
});
