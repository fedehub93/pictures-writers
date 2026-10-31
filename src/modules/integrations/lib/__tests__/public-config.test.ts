import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";

import {
  INTEGRATION_PROVIDER_GTM,
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

const completeGtmConfig = { containerId: "GTM-ABC1234" };

async function resetIntegrations() {
  await db.integration.deleteMany({
    where: {
      provider: {
        in: [INTEGRATION_PROVIDER_IUBENDA, INTEGRATION_PROVIDER_GTM],
      },
    },
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

async function createGtmRow(overrides: {
  isEnabled?: boolean;
  config?: Record<string, unknown>;
} = {}) {
  return db.integration.create({
    data: {
      provider: INTEGRATION_PROVIDER_GTM,
      isEnabled: overrides.isEnabled ?? true,
      config: overrides.config ?? completeGtmConfig,
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

  it("returns null when the integration row is missing, without logging", async () => {
    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns null when the integration is disabled, without logging", async () => {
    await createIubendaRow({ isEnabled: false });

    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns null when the configuration is incomplete and logs it", async () => {
    await createIubendaRow({ config: { siteId: "3303495" } });

    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(warn.mock.calls[0][0] as string)).toEqual({
      area: "integrations",
      event: "public_config_unavailable",
      provider: INTEGRATION_PROVIDER_IUBENDA,
      reason: "incomplete",
    });
  });

  it("returns null when the configuration is invalid and logs it", async () => {
    await createIubendaRow({
      config: { ...completeConfig, siteId: "not-a-number" },
    });

    await expect(
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
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

    expect(warn).not.toHaveBeenCalled();
  });

  describe("Google Tag Manager", () => {
    it("returns the container id for an enabled, complete row", async () => {
      await createGtmRow();

      await expect(
        resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_GTM),
      ).resolves.toEqual(completeGtmConfig);
    });

    it("returns null when the integration row is missing, without logging", async () => {
      await expect(
        resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_GTM),
      ).resolves.toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });

    it("returns null when the integration is disabled, without logging", async () => {
      await createGtmRow({ isEnabled: false });

      await expect(
        resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_GTM),
      ).resolves.toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });

    it("returns null when the container id is invalid and logs it", async () => {
      await createGtmRow({ config: { containerId: "GT-XXXX" } });

      await expect(
        resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_GTM),
      ).resolves.toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });
});
