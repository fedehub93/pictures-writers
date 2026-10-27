import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";

import {
  INTEGRATION_PROVIDER_IUBENDA,
  encryptIntegrationSecrets,
  resolveIntegrationPublicConfig,
  withIntegrationResolutionCache,
} from "../";

const completeConfig = {
  siteId: "3303495",
  cookiePolicyId: "123456",
  lang: "it",
  autoblocking: true,
  consentMode: true,
};

async function resetIntegrations() {
  await db.integration.deleteMany({
    where: { provider: INTEGRATION_PROVIDER_IUBENDA },
  });
}

async function createIubendaRow(overrides: {
  isEnabled?: boolean;
  config?: Record<string, unknown>;
} = {}) {
  return db.integration.create({
    data: {
      provider: INTEGRATION_PROVIDER_IUBENDA,
      isEnabled: overrides.isEnabled ?? true,
      config: overrides.config ?? completeConfig,
      secretEncrypted: encryptIntegrationSecrets({}),
    },
  });
}

describe("resolveIntegrationPublicConfig", () => {
  const originalPrimaryKey = process.env.SECRETS_ENCRYPTION_KEY;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    process.env.SECRETS_ENCRYPTION_KEY = "primary-key-0123456789abcdef";
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await resetIntegrations();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await resetIntegrations();

    if (originalPrimaryKey === undefined) {
      delete process.env.SECRETS_ENCRYPTION_KEY;
    } else {
      process.env.SECRETS_ENCRYPTION_KEY = originalPrimaryKey;
    }
  });

  it("returns null when the integration row is missing", async () => {
    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns null when the integration is disabled", async () => {
    await createIubendaRow({ isEnabled: false });

    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
  });

  it("returns null when the configuration is incomplete", async () => {
    await createIubendaRow({ config: { siteId: "3303495" } });

    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
  });

  it("returns null when the configuration is invalid", async () => {
    await createIubendaRow({
      config: { ...completeConfig, siteId: "not-a-number" },
    });

    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
  });

  it("returns the parsed configuration for a complete enabled row", async () => {
    await createIubendaRow();

    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toEqual(completeConfig);
  });

  it("returns null instead of throwing when the read fails", async () => {
    vi.spyOn(db.integration, "findUnique").mockRejectedValueOnce(
      new Error("database unavailable"),
    );

    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("memoizes a resolved configuration within a request cache", async () => {
    await createIubendaRow();

    await withIntegrationResolutionCache(async () => {
      const first = await resolveIntegrationPublicConfig(
        INTEGRATION_PROVIDER_IUBENDA,
      );
      await resetIntegrations();
      const second = await resolveIntegrationPublicConfig(
        INTEGRATION_PROVIDER_IUBENDA,
      );

      expect(second).toEqual(first);
    });
  });

  it("memoizes a missing configuration within a request cache", async () => {
    await withIntegrationResolutionCache(async () => {
      const first = await resolveIntegrationPublicConfig(
        INTEGRATION_PROVIDER_IUBENDA,
      );
      await createIubendaRow();
      const second = await resolveIntegrationPublicConfig(
        INTEGRATION_PROVIDER_IUBENDA,
      );

      expect(first).toBeNull();
      expect(second).toBeNull();
    });

    expect(warn).toHaveBeenCalledTimes(1);
  });
});
