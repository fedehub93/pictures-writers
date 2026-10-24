import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createLocalStorageDriver } from "../local";
import type { StorageDriver } from "../types";

describe("local storage driver", () => {
  let root: string;
  let driver: StorageDriver;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-storage-local-"));
    driver = createLocalStorageDriver({
      root,
      publicBaseUrl: "/media",
    });
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("keeps every object inside the configured root", async () => {
    await driver.put("media-1/1/original", new Uint8Array([1]), "image/png");

    await expect(driver.get("media-1/1/original")).resolves.toEqual(
      new Uint8Array([1]),
    );
  });

  it("refuses keys that could escape the root", async () => {
    await expect(
      driver.put("../outside", new Uint8Array([1]), "image/png"),
    ).rejects.toThrowError(/Invalid storage key/);
    await expect(
      driver.put("media-1/../../outside", new Uint8Array([1]), "image/png"),
    ).rejects.toThrowError(/Invalid storage key/);
    await expect(
      driver.put("media-1\\..\\outside", new Uint8Array([1]), "image/png"),
    ).rejects.toThrowError(/Invalid storage key/);
  });

  it("refuses prefixes that could escape the root", async () => {
    await expect(driver.deletePrefix("../")).rejects.toThrowError(
      /Invalid storage prefix/,
    );
  });
});
