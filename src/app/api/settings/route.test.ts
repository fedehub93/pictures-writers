import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";
import {
  resetStorageDriverSetting,
  setStorageDriverSetting,
} from "@/modules/media/server/__tests__/storage-setting-fixtures";

import { PATCH } from "./route";

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

function patch(body: unknown): Request {
  return new Request("http://localhost/api/settings", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function storedStorageDriver(): Promise<string | null | undefined> {
  const settings = await db.settings.findFirst({
    select: { storageDriver: true },
  });

  return settings?.storageDriver;
}

describe("PATCH /api/settings storageDriver", () => {
  let previousToken: string | undefined;

  beforeEach(async () => {
    previousToken = process.env.UPLOADTHING_TOKEN;
    delete process.env.UPLOADTHING_TOKEN;

    await setStorageDriverSetting(null);
  });

  afterEach(async () => {
    if (previousToken === undefined) {
      delete process.env.UPLOADTHING_TOKEN;
    } else {
      process.env.UPLOADTHING_TOKEN = previousToken;
    }

    await resetStorageDriverSetting();
  });

  it("saves local disk as the active driver", async () => {
    const response = await PATCH(patch({ storageDriver: "local" }));

    expect(response.status).toBe(200);
    await expect(storedStorageDriver()).resolves.toBe("local");
  });

  it("rejects an unknown driver instead of silently defaulting", async () => {
    const response = await PATCH(patch({ storageDriver: "s3" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/local|uploadthing/i);
    await expect(storedStorageDriver()).resolves.toBeNull();
  });

  it("rejects clearing the choice with null", async () => {
    const response = await PATCH(patch({ storageDriver: null }));

    expect(response.status).toBe(400);
    await expect(storedStorageDriver()).resolves.toBeNull();
  });

  it("refuses UploadThing while no token is configured, and says why", async () => {
    const response = await PATCH(patch({ storageDriver: "uploadthing" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/UPLOADTHING_TOKEN/);
    await expect(storedStorageDriver()).resolves.toBeNull();
  });

  it("accepts UploadThing once a token is configured", async () => {
    process.env.UPLOADTHING_TOKEN = "secret";

    const response = await PATCH(patch({ storageDriver: "uploadthing" }));

    expect(response.status).toBe(200);
    await expect(storedStorageDriver()).resolves.toBe("uploadthing");
  });
});
