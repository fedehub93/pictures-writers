import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import {
  INTEGRATION_PROVIDER_RESEND,
  encryptIntegrationSecrets,
  resolveIntegrationSecrets,
  IntegrationResolutionError,
  withIntegrationResolutionCache,
  invalidateCachedIntegrationSecrets,
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
  const originalResendKey = process.env.NEXT_RESEND_KEY;
  const originalWebhookSecret = process.env.NEXT_RESEND_WEBHOOK_SECRET;
  const originalPrimaryKey = process.env.SECRETS_ENCRYPTION_KEY;

  beforeEach(async () => {
    process.env.SECRETS_ENCRYPTION_KEY = "primary-key-0123456789abcdef";
    process.env.NEXT_RESEND_KEY = "env-resend-key";
    delete process.env.NEXT_RESEND_WEBHOOK_SECRET;
    await resetIntegrationTable();
  });

  afterEach(async () => {
    if (originalPrimaryKey === undefined) {
      delete process.env.SECRETS_ENCRYPTION_KEY;
    } else {
      process.env.SECRETS_ENCRYPTION_KEY = originalPrimaryKey;
    }

    if (originalResendKey === undefined) {
      delete process.env.NEXT_RESEND_KEY;
    } else {
      process.env.NEXT_RESEND_KEY = originalResendKey;
    }

    if (originalWebhookSecret === undefined) {
      delete process.env.NEXT_RESEND_WEBHOOK_SECRET;
    } else {
      process.env.NEXT_RESEND_WEBHOOK_SECRET = originalWebhookSecret;
    }

    await resetIntegrationTable();
  });

  it("falls back to environment variables when no integration row exists", async () => {
    const secrets = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);

    expect(secrets.apiKey).toBe("env-resend-key");
    expect(secrets.webhookSecret).toBeUndefined();
  });

  it("includes the webhook secret from the environment when present", async () => {
    process.env.NEXT_RESEND_WEBHOOK_SECRET = "env-webhook-secret";

    const secrets = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);

    expect(secrets.webhookSecret).toBe("env-webhook-secret");
  });

  it("throws an explicit error when no row exists and the env key is missing", async () => {
    delete process.env.NEXT_RESEND_KEY;

    await expect(resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND)).rejects.toThrow(
      IntegrationResolutionError,
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

  it("does not fall back to the environment when the row is disabled", async () => {
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

  it("invalidates the cached resolution on demand", async () => {
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: encryptIntegrationSecrets({ apiKey: "old-key" }),
      },
    });

    await withIntegrationResolutionCache(async () => {
      const first = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);
      expect(first.apiKey).toBe("old-key");

      await db.integration.update({
        where: { provider: INTEGRATION_PROVIDER_RESEND },
        data: {
          secretEncrypted: encryptIntegrationSecrets({ apiKey: "new-key" }),
        },
      });

      invalidateCachedIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);

      const second = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);
      expect(second.apiKey).toBe("new-key");
    });
  });
});
