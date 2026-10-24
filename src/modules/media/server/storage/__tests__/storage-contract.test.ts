import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createLocalStorageDriver } from "../local";
import { StorageObjectNotFoundError, type StorageDriver } from "../types";
import { createUploadThingStorageDriver } from "../uploadthing";
import { createFakeUploadThingApi } from "./fake-uploadthing";

interface Harness {
  driver: StorageDriver;
  cleanup: () => Promise<void>;
}

async function createLocalHarness(): Promise<Harness> {
  const root = await mkdtemp(path.join(tmpdir(), "media-storage-"));

  return {
    driver: createLocalStorageDriver({ root, publicBaseUrl: "/media" }),
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

async function createUploadThingHarness(): Promise<Harness> {
  const fake = createFakeUploadThingApi();

  return {
    driver: createUploadThingStorageDriver(fake.api, fake.fetch),
    cleanup: async () => {},
  };
}

const harnesses = [
  ["local", createLocalHarness],
  ["uploadthing", createUploadThingHarness],
] as const;

describe.each(harnesses)("%s storage driver", (_name, createHarness) => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  it("reads back byte-identical content that was written", async () => {
    const { driver } = harness;
    const bytes = Uint8Array.from({ length: 256 }, (_, index) => index);

    await driver.put("media-1/1/original", bytes, "image/png");

    await expect(driver.get("media-1/1/original")).resolves.toEqual(bytes);
  });

  it("addresses a written object by a public URL", async () => {
    const { driver } = harness;

    await driver.put("media-1/1/original", new Uint8Array([1, 2, 3]), "image/png");

    const url = await driver.url("media-1/1/original");

    expect(() => new URL(url, "https://example.test/")).not.toThrow();
    expect(url).toContain("original");
  });

  it("fails with a typed error when reading a missing object", async () => {
    const { driver } = harness;

    await expect(driver.get("media-404/1/original")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("fails with a typed error when deleting a missing object", async () => {
    const { driver } = harness;

    await expect(driver.delete("media-404/1/original")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("fails with a typed error when addressing a missing object", async () => {
    const { driver } = harness;

    await expect(driver.url("media-404/1/original")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("overwrites an object written again at the same key", async () => {
    const { driver } = harness;

    await driver.put("media-1/1/original", new Uint8Array([1]), "image/png");
    await driver.put("media-1/1/original", new Uint8Array([2]), "image/png");

    await expect(driver.get("media-1/1/original")).resolves.toEqual(
      new Uint8Array([2]),
    );
  });

  it("deletes one object without touching its siblings", async () => {
    const { driver } = harness;

    await driver.put("media-1/1/original", new Uint8Array([1]), "image/png");
    await driver.put("media-1/1/256.webp", new Uint8Array([2]), "image/webp");

    await driver.delete("media-1/1/original");

    await expect(driver.get("media-1/1/original")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
    await expect(driver.get("media-1/1/256.webp")).resolves.toEqual(
      new Uint8Array([2]),
    );
  });

  it("deletes every object under a prefix and leaves sibling keys untouched", async () => {
    const { driver } = harness;

    await driver.put("media-1/1/original", new Uint8Array([1]), "image/png");
    await driver.put("media-1/1/256.webp", new Uint8Array([2]), "image/webp");
    await driver.put("media-10/1/original", new Uint8Array([3]), "image/png");

    await expect(driver.deletePrefix("media-1/")).resolves.toBe(2);

    await expect(driver.get("media-1/1/original")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
    await expect(driver.get("media-1/1/256.webp")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
    await expect(driver.get("media-10/1/original")).resolves.toEqual(
      new Uint8Array([3]),
    );
  });

  it("deletes nothing when no object matches the prefix", async () => {
    const { driver } = harness;

    await driver.put("media-1/1/original", new Uint8Array([1]), "image/png");

    await expect(driver.deletePrefix("media-2/")).resolves.toBe(0);
    await expect(driver.get("media-1/1/original")).resolves.toEqual(
      new Uint8Array([1]),
    );
  });
});
