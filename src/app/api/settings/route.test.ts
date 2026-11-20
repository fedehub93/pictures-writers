import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";
import {
  MEDIA_QUOTA_DEFAULT_MB,
  PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
} from "@/modules/media/lib/quota";
import {
  resetMediaQuota,
  setPublicOriginReserveMb,
} from "@/modules/media/server/__tests__/quota-fixtures";
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

describe("PATCH /api/settings publicOriginReserveMb", () => {
  async function storedReserve(): Promise<number | undefined> {
    const settings = await db.settings.findFirst({
      select: { publicOriginReserveMb: true },
    });

    return settings?.publicOriginReserveMb;
  }

  async function storedQuota(): Promise<number | undefined> {
    const settings = await db.settings.findFirst({
      select: { mediaQuotaMb: true },
    });

    return settings?.mediaQuotaMb;
  }

  beforeEach(async () => {
    await setPublicOriginReserveMb(PUBLIC_ORIGIN_RESERVE_DEFAULT_MB);
  });

  afterEach(async () => {
    await resetMediaQuota();
  });

  it("saves a whole number of megabytes, including zero", async () => {
    const first = await PATCH(patch({ publicOriginReserveMb: "256" }));
    expect(first.status).toBe(200);
    await expect(storedReserve()).resolves.toBe(256);

    const zero = await PATCH(patch({ publicOriginReserveMb: 0 }));
    expect(zero.status).toBe(200);
    await expect(storedReserve()).resolves.toBe(0);
  });

  it("rejects a fractional, negative or missing value instead of defaulting", async () => {
    for (const value of ["1.5", -1, "", null]) {
      const response = await PATCH(patch({ publicOriginReserveMb: value }));

      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/whole number/i);
    }

    await expect(storedReserve()).resolves.toBe(
      PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
    );
  });

  it("refuses a reserve larger than the quota and keeps both unchanged", async () => {
    const response = await PATCH(
      patch({ mediaQuotaMb: 10, publicOriginReserveMb: 20 }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/inside the quota/i);
    await expect(storedQuota()).resolves.toBe(MEDIA_QUOTA_DEFAULT_MB);
    await expect(storedReserve()).resolves.toBe(
      PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
    );
  });

  it("accepts a reserve inside the quota", async () => {
    const response = await PATCH(
      patch({ mediaQuotaMb: 10, publicOriginReserveMb: 2 }),
    );

    expect(response.status).toBe(200);
    await expect(storedQuota()).resolves.toBe(10);
    await expect(storedReserve()).resolves.toBe(2);
  });
});
