import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { EmailProvider } from "@/generated/prisma";
import {
  INTEGRATION_PROVIDER_RESEND,
  encryptIntegrationSecrets,
} from "@/modules/integrations/lib";

import { resolveAdapter, getProviderAdapter } from "../provider";

describe("resolveAdapter", () => {
  const originalPrimaryKey = process.env.SECRETS_ENCRYPTION_KEY;

  beforeEach(async () => {
    process.env.SECRETS_ENCRYPTION_KEY = "primary-key-0123456789abcdef";
    await db.emailSetting.deleteMany();
    await db.integration.deleteMany({ where: { provider: INTEGRATION_PROVIDER_RESEND } });
  });

  afterEach(async () => {
    if (originalPrimaryKey === undefined) {
      delete process.env.SECRETS_ENCRYPTION_KEY;
    } else {
      process.env.SECRETS_ENCRYPTION_KEY = originalPrimaryKey;
    }
    await db.emailSetting.deleteMany();
    await db.integration.deleteMany({ where: { provider: INTEGRATION_PROVIDER_RESEND } });
  });

  async function seedSettings(provider: EmailProvider = EmailProvider.RESEND) {
    return db.emailSetting.create({
      data: {
        emailSender: "sender@example.com",
        emailSenderName: "Pictures Writers",
        emailProvider: provider,
        emailResponse: "reply@example.com",
      },
    });
  }

  it("throws not configured when no integration row exists", async () => {
    await seedSettings();

    await expect(resolveAdapter()).rejects.toThrow(/not configured/i);
  });

  it("constructs the Resend adapter with the database key when an enabled integration row exists", async () => {
    await seedSettings();
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: encryptIntegrationSecrets({ apiKey: "db-resend-key" }),
      },
    });

    const adapter = await resolveAdapter();

    expect(adapter).toBeDefined();
  });

  it("throws when the Resend integration row is disabled", async () => {
    await seedSettings();
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: false,
        secretEncrypted: encryptIntegrationSecrets({ apiKey: "db-resend-key" }),
      },
    });

    await expect(resolveAdapter()).rejects.toThrow(/disabled/i);
  });

  it("throws when the Resend integration row is enabled but incomplete", async () => {
    await seedSettings();
    await db.integration.create({
      data: {
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secretEncrypted: encryptIntegrationSecrets({}),
      },
    });

    await expect(resolveAdapter()).rejects.toThrow(/apiKey/i);
  });

  it("throws when email settings are missing", async () => {
    await expect(resolveAdapter()).rejects.toThrow("Settings is incorrect");
  });

  describe("getProviderAdapter", () => {
    it("constructs a Resend adapter with the provided api key", () => {
      const adapter = getProviderAdapter(EmailProvider.RESEND, {
        apiKey: "injected-key",
      });

      expect(adapter).toBeDefined();
    });

    it("throws when SendGrid is requested", () => {
      expect(() =>
        getProviderAdapter(EmailProvider.SENDGRID, { apiKey: "any" }),
      ).toThrow(/SendGrid/i);
    });
  });
});
