import { describe, expect, it } from "vitest";

import { createFakeUploadThingApi } from "./fake-uploadthing";
import { createUploadThingStorageDriver } from "../uploadthing";

describe("UploadThing storage driver legacy objects", () => {
  it("reads and addresses a pre-seam object stored by its provider file key", async () => {
    const fake = createFakeUploadThingApi();
    const driver = createUploadThingStorageDriver(fake.api, fake.fetch);
    const bytes = new Uint8Array([1, 2, 3]);

    await driver.put("media-1/1/original", bytes, "image/png");

    // The fake stores a provider-generated file key; legacy Media rows kept
    // that key instead of a customId, and the backfill still has to read them.
    await expect(driver.get("file-media-1/1/original")).resolves.toEqual(bytes);
    await expect(driver.url("file-media-1/1/original")).resolves.toContain(
      "/f/",
    );
  });
});
