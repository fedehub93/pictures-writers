import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import {
  INTEGRATION_PROVIDER_RESEND,
  encryptIntegrationSecrets,
  resolveIntegrationSecrets,
  IntegrationResolutionError,
  withIntegrationResolutionCache,
} from "../";

async function resetIntegrationTable() {
  await db.integration.deleteMany({
    where: { provider: INTEGRATION_PROVIDER_RESEND },
  });
}

function encryptResendSecrets(secrets: { apiKey?: string; webhookSecret?: string }): string {
  return encryptIntegrationSecrets(secrets);
}

describe("resolveIntegrationSecrets", () => {
  const originalPrimaryKey = process.env.SECRETS_ENCRYPTION_KEY;

  beforeEach(async () => {
    process.env.SECRETS_ENCRYPTION_KEY = "primary-key-0123456789abcdef";
    await resetIntegrationTable();
  });

  afterEach(async () => {
    if (originalPrimaryKey === undefined) {
      delete process.env.SECRETS_ENCRYPTION_KEY;
    } else {
      process.env.SECRETS_ENCRYPTION_KEY = originalPrimaryKey;
    }

    await resetIntegrationTable();
  });

  it("reports not configured when no integration row exists", async () => {
    await expect(resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND)).rejects.toThrow(
      /\bResend\b.*not configured/i,
    );
  });

  it("returns the API key from an enabled integration row", async () => {
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: encryptResendSecrets({ apiKey: "db-resend-key" }),
      },
    });

    const secrets = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);

    expect(secrets.apiKey).toBe("db-resend-key");
    expect(secrets.webhookSecret).toBeUndefined();
  });

  it("returns the webhook secret from an enabled integration row when present", async () => {
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: encryptResendSecrets({
          apiKey: "db-resend-key",
          webhookSecret: "db-webhook-secret",
        }),
      },
    });

    const secrets = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);

    expect(secrets.apiKey).toBe("db-resend-key");
    expect(secrets.webhookSecret).toBe("db-webhook-secret");
  });

  it("allows outbound sending without a webhook secret", async () => {
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: encryptResendSecrets({ apiKey: "db-resend-key" }),
      },
    });

    const secrets = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);

    expect(secrets.apiKey).toBe("db-resend-key");
    expect(secrets.webhookSecret).toBeUndefined();
  });

  it("throws an explicit error when the integration row is disabled", async () => {
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: false,
        secretEncrypted: encryptResendSecrets({ apiKey: "db-resend-key" }),
      },
    });

    await expect(resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND)).rejects.toThrow(
      /disabled/i,
    );
  });

  it("throws an explicit error naming the missing field when the row is incomplete", async () => {
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: encryptResendSecrets({}),
      },
    });

    await expect(resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND)).rejects.toThrow(
      /apiKey/i,
    );
  });

  it("throws an explicit error when the ciphertext is malformed", async () => {
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: "enc:v1:primary:not-valid-base64!!!",
      },
    });

    await expect(resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND)).rejects.toThrow(
      IntegrationResolutionError,
    );
  });
});

describe("integration secrets encryption", () => {
  const originalPrimary = process.env.SECRETS_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = "primary-key-0123456789abcdef";
  });

  afterEach(() => {
    if (originalPrimary === undefined) {
      delete process.env.SECRETS_ENCRYPTION_KEY;
    } else {
      process.env.SECRETS_ENCRYPTION_KEY = originalPrimary;
    }
  });

  it("uses the primary key and encodes a JSON payload", () => {
    const encrypted = encryptIntegrationSecrets({ apiKey: "secret" });

    expect(encrypted).toMatch(/^enc:v1:primary:/);
  });
});

describe("integration resolution cache", () => {
  const originalPrimary = process.env.SECRETS_ENCRYPTION_KEY;

  beforeEach(async () => {
    process.env.SECRETS_ENCRYPTION_KEY = "primary-key-0123456789abcdef";
    await db.integration.deleteMany({
      where: { provider: INTEGRATION_PROVIDER_RESEND },
    });
  });

  afterEach(async () => {
    if (originalPrimary === undefined) {
      delete process.env.SECRETS_ENCRYPTION_KEY;
    } else {
      process.env.SECRETS_ENCRYPTION_KEY = originalPrimary;
    }

    await db.integration.deleteMany({
      where: { provider: INTEGRATION_PROVIDER_RESEND },
    });
  });

  it("memoizes resolution within a cached execution", async () => {
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: encryptIntegrationSecrets({ apiKey: "cached-key" }),
      },
    });

    const result = await withIntegrationResolutionCache(async () => {
      const first = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);
      const second = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);
      expect(first).toBe(second);
      return first;
    });

    expect(result.apiKey).toBe("cached-key");
  });
});
