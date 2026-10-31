import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
// exercised against the test database without a session.
vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

const emailsList = vi.fn();

vi.mock("@/shared/lib/revalidate-content", () => ({
  revalidateContent: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { list: emailsList } };
  }),
}));

import { createCallerFactory } from "@/trpc/init";

import { db } from "@/shared/lib/db";
import { revalidateContent } from "@/shared/lib/revalidate-content";

import {
  INTEGRATION_PROVIDER_GTM,
  INTEGRATION_PROVIDER_IUBENDA,
  INTEGRATION_PROVIDER_RESEND,
  encryptIntegrationSecrets,
  decryptIntegrationSecrets,
} from "@/modules/integrations/lib";

import {
  integrationsRouter,
  resetIntegrationTestRateLimit,
} from "../procedures";

const createCaller = createCallerFactory(integrationsRouter);

const integrationIds: string[] = [];
const userIds: string[] = [];
const activityIds: string[] = [];

let caller: ReturnType<typeof createCaller>;

const iubendaConfig = {
  siteId: "3303495",
  cookiePolicyId: "123456",
  lang: "it",
  autoblocking: true,
  consentMode: true,
};

const gtmConfig = { containerId: "GTM-ABC1234" };

const originalPrimaryKey = process.env.SECRETS_ENCRYPTION_KEY;

async function createUser() {
  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  return user;
}

async function createIntegration(overrides: {
  isEnabled?: boolean;
  config?: Record<string, unknown>;
  secrets?: { apiKey?: string; webhookSecret?: string };
  lastTestedAt?: Date;
  lastTestStatus?: string;
} = {}) {
  const integration = await db.integration.create({
    data: {
      provider: INTEGRATION_PROVIDER_RESEND,
      isEnabled: overrides.isEnabled ?? false,
      config: overrides.config ?? {},
      secretEncrypted: encryptIntegrationSecrets(overrides.secrets ?? {}),
      lastTestedAt: overrides.lastTestedAt ?? null,
      lastTestStatus: overrides.lastTestStatus ?? null,
    },
  });
  integrationIds.push(integration.id);
  return integration;
}

async function createIubendaIntegration(overrides: {
  isEnabled?: boolean;
  config?: Record<string, unknown>;
} = {}) {
  const integration = await db.integration.create({
    data: {
      provider: INTEGRATION_PROVIDER_IUBENDA,
      isEnabled: overrides.isEnabled ?? false,
      config: overrides.config ?? iubendaConfig,
      secretEncrypted: encryptIntegrationSecrets({}),
    },
  });
  integrationIds.push(integration.id);
  return integration;
}

async function createGtmIntegration(overrides: {
  isEnabled?: boolean;
  config?: Record<string, unknown>;
} = {}) {
  const integration = await db.integration.create({
    data: {
      provider: INTEGRATION_PROVIDER_GTM,
      isEnabled: overrides.isEnabled ?? false,
      config: overrides.config ?? gtmConfig,
      secretEncrypted: encryptIntegrationSecrets({}),
    },
  });
  integrationIds.push(integration.id);
  return integration;
}

beforeEach(async () => {
  integrationIds.length = 0;
  userIds.length = 0;
  activityIds.length = 0;

  process.env.SECRETS_ENCRYPTION_KEY = "primary-key-0123456789abcdef";

  resetIntegrationTestRateLimit(INTEGRATION_PROVIDER_RESEND);
  resetIntegrationTestRateLimit(INTEGRATION_PROVIDER_IUBENDA);
  resetIntegrationTestRateLimit(INTEGRATION_PROVIDER_GTM);
  emailsList.mockReset();
  vi.mocked(revalidateContent).mockClear();

  const user = await createUser();
  caller = createCaller({ userId: user.id, auth: { id: user.id } });

  await db.integration.deleteMany();
  await db.administrativeActivity.deleteMany({
    where: { targetType: "INTEGRATION" },
  });
});

afterEach(async () => {
  if (integrationIds.length > 0) {
    await db.integration.deleteMany({ where: { id: { in: integrationIds } } });
  }
  await db.administrativeActivity.deleteMany({
    where: { targetType: "INTEGRATION" },
  });
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }

  integrationIds.length = 0;
  userIds.length = 0;
  activityIds.length = 0;

  if (originalPrimaryKey === undefined) {
    delete process.env.SECRETS_ENCRYPTION_KEY;
  } else {
    process.env.SECRETS_ENCRYPTION_KEY = originalPrimaryKey;
  }
});

describe("integrationsRouter", () => {
  describe("getMany", () => {
    it("lists Resend with its enabled state, credential presence, and last test result", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "secret-key" },
        lastTestedAt: new Date("2026-01-01T00:00:00Z"),
        lastTestStatus: "SUCCESS",
      });

      const result = await caller.getMany();
      const resend = result.find(
        (integration) => integration.provider === INTEGRATION_PROVIDER_RESEND,
      );

      expect(result).toHaveLength(3);
      expect(resend).toMatchObject({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        canEnable: true,
        hasConnectionTest: true,
        config: {},
        lastTestStatus: "SUCCESS",
      });
      expect(resend!.lastTestedAt).toBeInstanceOf(Date);
      expect(resend!.secrets).toEqual([
        {
          key: "apiKey",
          label: "API key",
          required: true,
          present: true,
        },
        {
          key: "webhookSecret",
          label: "Webhook secret",
          required: false,
          present: false,
        },
      ]);
    });

    it("returns an unconfigured entry when no integration row exists", async () => {
      const result = await caller.getMany();
      const resend = result.find(
        (integration) => integration.provider === INTEGRATION_PROVIDER_RESEND,
      );

      expect(result).toHaveLength(3);
      expect(resend).toMatchObject({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: false,
        canEnable: false,
        hasConnectionTest: true,
        config: {},
        lastTestedAt: null,
        lastTestStatus: null,
      });
      expect(resend!.secrets).toEqual([
        {
          key: "apiKey",
          label: "API key",
          required: true,
          present: false,
        },
        {
          key: "webhookSecret",
          label: "Webhook secret",
          required: false,
          present: false,
        },
      ]);
    });

    it("never returns secret values, ciphertext, or provider-specific credential fields", async () => {
      await createIntegration({
        secrets: { apiKey: "secret-key", webhookSecret: "secret-webhook" },
      });

      const result = await caller.getMany();
      const resend = result.find(
        (integration) => integration.provider === INTEGRATION_PROVIDER_RESEND,
      );

      const keys = Object.keys(resend!);
      expect(keys).not.toContain("secretEncrypted");
      expect(keys).not.toContain("apiKey");
      expect(keys).not.toContain("webhookSecret");
      expect(keys).not.toContain("hasApiKey");
      expect(keys).not.toContain("hasWebhookSecret");
      expect(resend!.secrets).toEqual([
        {
          key: "apiKey",
          label: "API key",
          required: true,
          present: true,
        },
        {
          key: "webhookSecret",
          label: "Webhook secret",
          required: false,
          present: true,
        },
      ]);
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain("secret-key");
      expect(serialized).not.toContain("secret-webhook");
    });

    it("lists Iubenda with configuration but no credentials or connection test", async () => {
      await createIubendaIntegration({ isEnabled: true });

      const result = await caller.getMany();
      const iubenda = result.find(
        (integration) => integration.provider === INTEGRATION_PROVIDER_IUBENDA,
      );

      expect(iubenda).toMatchObject({
        provider: INTEGRATION_PROVIDER_IUBENDA,
        isEnabled: true,
        canEnable: true,
        hasConnectionTest: false,
        config: iubendaConfig,
      });
      expect(iubenda!.secrets).toEqual([]);
      expect(JSON.stringify(iubenda)).not.toMatch(/apiKey|webhookSecret/i);
    });

    it("lists Google Tag Manager with configuration but no credentials or connection test", async () => {
      await createGtmIntegration({ isEnabled: true });

      const result = await caller.getMany();
      const gtm = result.find(
        (integration) => integration.provider === INTEGRATION_PROVIDER_GTM,
      );

      expect(gtm).toMatchObject({
        provider: INTEGRATION_PROVIDER_GTM,
        isEnabled: true,
        canEnable: true,
        hasConnectionTest: false,
        config: gtmConfig,
      });
      expect(gtm!.secrets).toEqual([]);
      expect(JSON.stringify(gtm)).not.toMatch(/apiKey|webhookSecret/i);
    });
  });

  describe("update", () => {
    it("creates a new integration row when one does not exist", async () => {
      const updated = await caller.update({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secrets: { apiKey: "new-key" },
      });

      integrationIds.push((await db.integration.findFirstOrThrow()).id);

      expect(updated.isEnabled).toBe(true);
      expect(updated.canEnable).toBe(true);
      expect(updated.secrets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "apiKey", present: true }),
        ]),
      );
    });

    it("rejects enabling when the provider's rule is not satisfied", async () => {
      await expect(
        caller.update({
          provider: INTEGRATION_PROVIDER_RESEND,
          isEnabled: true,
        }),
      ).rejects.toThrow(/required configuration or credentials/i);

      const row = await db.integration.findFirst();
      expect(row).toBeNull();
    });

    it("rejects removing a required secret while the provider is enabled", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "old-key" },
      });

      await expect(
        caller.update({
          provider: INTEGRATION_PROVIDER_RESEND,
          secrets: { apiKey: null },
        }),
      ).rejects.toThrow(/required configuration or credentials/i);

      const row = await db.integration.findFirstOrThrow();
      const secrets = decryptIntegrationSecrets(row.secretEncrypted) as {
        apiKey?: string;
      };
      expect(secrets.apiKey).toBe("old-key");
      expect(row.isEnabled).toBe(true);
    });

    it("replaces a secret with a non-empty string", async () => {
      await createIntegration({ secrets: { apiKey: "old-key" } });

      await caller.update({
        provider: INTEGRATION_PROVIDER_RESEND,
        secrets: { apiKey: "new-key" },
      });

      const row = await db.integration.findFirstOrThrow();
      const secrets = decryptIntegrationSecrets(row.secretEncrypted) as {
        apiKey: string;
      };
      expect(secrets.apiKey).toBe("new-key");
    });

    it("removes a secret when the update value is null", async () => {
      await createIntegration({
        secrets: { apiKey: "old-key", webhookSecret: "old-secret" },
      });

      await caller.update({
        provider: INTEGRATION_PROVIDER_RESEND,
        secrets: { webhookSecret: null },
      });

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);
      const payload = decryptIntegrationSecrets(row.secretEncrypted) as {
        apiKey?: string;
        webhookSecret?: string;
      };
      expect(payload.apiKey).toBe("old-key");
      expect(payload.webhookSecret).toBeUndefined();
    });

    it("keeps the current secret when the update value is undefined", async () => {
      await createIntegration({ secrets: { apiKey: "old-key" } });

      await caller.update({
        provider: INTEGRATION_PROVIDER_RESEND,
        secrets: { apiKey: undefined },
      });

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);
      const payload = decryptIntegrationSecrets(row.secretEncrypted) as {
        apiKey: string;
      };
      expect(payload.apiKey).toBe("old-key");
    });

    it("keeps the current secret when the update value is an empty string", async () => {
      await createIntegration({ secrets: { apiKey: "old-key" } });

      await caller.update({
        provider: INTEGRATION_PROVIDER_RESEND,
        secrets: { apiKey: "" },
      });

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);
      const payload = decryptIntegrationSecrets(row.secretEncrypted) as {
        apiKey: string;
      };
      expect(payload.apiKey).toBe("old-key");
    });

    it("records an audit entry with no secret material", async () => {
      await caller.update({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        secrets: { apiKey: "audit-key" },
      });

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);

      const activity = await db.administrativeActivity.findFirst({
        where: { targetType: "INTEGRATION", action: "INTEGRATION_CREATED" },
      });
      expect(activity).not.toBeNull();
      activityIds.push(activity!.id);

      const after = activity!.after as Record<string, unknown>;
      expect(after.secretKeys).toEqual(["apiKey"]);
      expect(after.config).toEqual({});
      expect(Object.keys(after)).not.toContain("apiKey");
      expect(Object.keys(after)).not.toContain("secretEncrypted");
      expect(JSON.stringify(after)).not.toContain("audit-key");
    });

    it("persists Iubenda configuration and enables it in one call", async () => {
      const updated = await caller.update({
        provider: INTEGRATION_PROVIDER_IUBENDA,
        config: iubendaConfig,
        isEnabled: true,
      });

      integrationIds.push(
        (await db.integration.findFirstOrThrow({
          where: { provider: INTEGRATION_PROVIDER_IUBENDA },
        })).id,
      );

      expect(updated).toMatchObject({
        provider: INTEGRATION_PROVIDER_IUBENDA,
        isEnabled: true,
        canEnable: true,
        hasConnectionTest: false,
        config: iubendaConfig,
      });
      expect(updated.secrets).toEqual([]);
    });

    it("rejects enabling Iubenda when its configuration is incomplete", async () => {
      await expect(
        caller.update({
          provider: INTEGRATION_PROVIDER_IUBENDA,
          config: {
            siteId: "3303495",
            lang: "it",
          },
          isEnabled: true,
        }),
      ).rejects.toThrow(/invalid configuration/i);

      const row = await db.integration.findFirst({
        where: { provider: INTEGRATION_PROVIDER_IUBENDA },
      });
      expect(row).toBeNull();
    });

    it("records Iubenda configuration in the audit payload without credentials", async () => {
      await caller.update({
        provider: INTEGRATION_PROVIDER_IUBENDA,
        config: iubendaConfig,
        isEnabled: true,
      });

      const row = await db.integration.findFirstOrThrow({
        where: { provider: INTEGRATION_PROVIDER_IUBENDA },
      });
      integrationIds.push(row.id);

      const activity = await db.administrativeActivity.findFirstOrThrow({
        where: {
          targetType: "INTEGRATION",
          action: "INTEGRATION_CREATED",
          targetId: row.id,
        },
      });
      activityIds.push(activity.id);

      const after = activity.after as Record<string, unknown>;
      expect(after.config).toEqual(iubendaConfig);
      expect(after.secretKeys).toEqual([]);
    });

    it("persists a normalised Google Tag Manager container id and enables it in one call", async () => {
      const updated = await caller.update({
        provider: INTEGRATION_PROVIDER_GTM,
        config: { containerId: "  gtm-abc1234  " },
        isEnabled: true,
      });

      integrationIds.push(
        (await db.integration.findFirstOrThrow({
          where: { provider: INTEGRATION_PROVIDER_GTM },
        })).id,
      );

      expect(updated).toMatchObject({
        provider: INTEGRATION_PROVIDER_GTM,
        isEnabled: true,
        canEnable: true,
        hasConnectionTest: false,
        config: gtmConfig,
      });
      expect(updated.secrets).toEqual([]);
    });

    it("rejects a malformed Google Tag Manager container id", async () => {
      await expect(
        caller.update({
          provider: INTEGRATION_PROVIDER_GTM,
          config: { containerId: "GT-XXXX" },
        }),
      ).rejects.toThrow(/invalid configuration/i);

      const row = await db.integration.findFirst({
        where: { provider: INTEGRATION_PROVIDER_GTM },
      });
      expect(row).toBeNull();
    });

    it("rejects enabling Google Tag Manager without a container id", async () => {
      await expect(
        caller.update({
          provider: INTEGRATION_PROVIDER_GTM,
          config: {},
          isEnabled: true,
        }),
      ).rejects.toThrow(/invalid configuration/i);

      const row = await db.integration.findFirst({
        where: { provider: INTEGRATION_PROVIDER_GTM },
      });
      expect(row).toBeNull();
    });

    it("records Google Tag Manager configuration in the audit payload without credentials", async () => {
      await caller.update({
        provider: INTEGRATION_PROVIDER_GTM,
        config: gtmConfig,
        isEnabled: true,
      });

      const row = await db.integration.findFirstOrThrow({
        where: { provider: INTEGRATION_PROVIDER_GTM },
      });
      integrationIds.push(row.id);

      const activity = await db.administrativeActivity.findFirstOrThrow({
        where: {
          targetType: "INTEGRATION",
          action: "INTEGRATION_CREATED",
          targetId: row.id,
        },
      });
      activityIds.push(activity.id);

      const after = activity.after as Record<string, unknown>;
      expect(after.config).toEqual(gtmConfig);
      expect(after.secretKeys).toEqual([]);
    });
  });

  describe("setEnabled", () => {
    it("toggles the enabled state and persists it", async () => {
      const integration = await createIntegration({ isEnabled: true });

      await caller.setEnabled({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: false,
      });

      const reloaded = await db.integration.findUniqueOrThrow({
        where: { id: integration.id },
      });
      expect(reloaded.isEnabled).toBe(false);
    });

    it("throws NOT_FOUND for an unknown provider", async () => {
      await expect(
        // @ts-expect-error testing runtime validation of an invalid provider
        caller.setEnabled({ provider: "unknown", isEnabled: true }),
      ).rejects.toThrow();
    });

    it("rejects enabling when the provider's rule is not satisfied", async () => {
      const integration = await createIntegration({ isEnabled: false });

      await expect(
        caller.setEnabled({
          provider: INTEGRATION_PROVIDER_RESEND,
          isEnabled: true,
        }),
      ).rejects.toThrow(/required configuration or credentials/i);

      const reloaded = await db.integration.findUniqueOrThrow({
        where: { id: integration.id },
      });
      expect(reloaded.isEnabled).toBe(false);
    });

    it("rejects enabling when the stored required secret is blank", async () => {
      const integration = await createIntegration({
        isEnabled: false,
        secrets: { apiKey: "" },
      });

      await expect(
        caller.setEnabled({
          provider: INTEGRATION_PROVIDER_RESEND,
          isEnabled: true,
        }),
      ).rejects.toThrow(/invalid credentials/i);

      const reloaded = await db.integration.findUniqueOrThrow({
        where: { id: integration.id },
      });
      expect(reloaded.isEnabled).toBe(false);
    });

    it("records an audit entry for enable/disable", async () => {
      const integration = await createIntegration({
        isEnabled: false,
        secrets: { apiKey: "test-key" },
      });

      await caller.setEnabled({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
      });

      const activity = await db.administrativeActivity.findFirst({
        where: {
          targetType: "INTEGRATION",
          targetId: integration.id,
          action: "INTEGRATION_ENABLED",
        },
      });
      expect(activity).not.toBeNull();
      activityIds.push(activity!.id);
    });

    it("enables a configured Iubenda integration", async () => {
      const integration = await createIubendaIntegration({ isEnabled: false });

      await caller.setEnabled({
        provider: INTEGRATION_PROVIDER_IUBENDA,
        isEnabled: true,
      });

      const reloaded = await db.integration.findUniqueOrThrow({
        where: { id: integration.id },
      });
      expect(reloaded.isEnabled).toBe(true);
    });

    it("rejects enabling Iubenda when its configuration is incomplete", async () => {
      const integration = await createIubendaIntegration({
        isEnabled: false,
        config: { siteId: "3303495" },
      });

      await expect(
        caller.setEnabled({
          provider: INTEGRATION_PROVIDER_IUBENDA,
          isEnabled: true,
        }),
      ).rejects.toThrow(/required configuration or credentials/i);

      const reloaded = await db.integration.findUniqueOrThrow({
        where: { id: integration.id },
      });
      expect(reloaded.isEnabled).toBe(false);
    });

    it("enables a configured Google Tag Manager integration", async () => {
      const integration = await createGtmIntegration({ isEnabled: false });

      await caller.setEnabled({
        provider: INTEGRATION_PROVIDER_GTM,
        isEnabled: true,
      });

      const reloaded = await db.integration.findUniqueOrThrow({
        where: { id: integration.id },
      });
      expect(reloaded.isEnabled).toBe(true);
    });

    it("rejects enabling Google Tag Manager when the container id is invalid", async () => {
      const integration = await createGtmIntegration({
        isEnabled: false,
        config: { containerId: "GT-XXXX" },
      });

      await expect(
        caller.setEnabled({
          provider: INTEGRATION_PROVIDER_GTM,
          isEnabled: true,
        }),
      ).rejects.toThrow(/required configuration or credentials/i);

      const reloaded = await db.integration.findUniqueOrThrow({
        where: { id: integration.id },
      });
      expect(reloaded.isEnabled).toBe(false);
    });
  });

  describe("test", () => {
    it("persists SUCCESS on a passing test", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "test-key" },
      });
      emailsList.mockResolvedValue({ data: [], error: null });

      const result = await caller.test({ provider: INTEGRATION_PROVIDER_RESEND });

      expect(result.lastTestStatus).toBe("SUCCESS");
      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);
      expect(row.lastTestStatus).toBe("SUCCESS");
      expect(row.lastTestedAt).toBeInstanceOf(Date);
    });

    it("persists FAILURE on a failing test and throws", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "test-key" },
      });
      emailsList.mockResolvedValue({
        data: null,
        error: { message: "Invalid API key" },
      });

      await expect(
        caller.test({ provider: INTEGRATION_PROVIDER_RESEND }),
      ).rejects.toThrow("Invalid API key");

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);
      expect(row.lastTestStatus).toBe("FAILURE");
    });

    it("persists FAILURE when the connection test throws", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "test-key" },
      });
      emailsList.mockRejectedValue(new Error("Network error"));

      await expect(
        caller.test({ provider: INTEGRATION_PROVIDER_RESEND }),
      ).rejects.toThrow("Network error");

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);
      expect(row.lastTestStatus).toBe("FAILURE");
    });

    it("throws when the integration is disabled", async () => {
      await createIntegration({ isEnabled: false, secrets: { apiKey: "test-key" } });

      await expect(
        caller.test({ provider: INTEGRATION_PROVIDER_RESEND }),
      ).rejects.toThrow();
    });

    it("throws when the API key is missing", async () => {
      await createIntegration({ isEnabled: true, secrets: {} });

      await expect(
        caller.test({ provider: INTEGRATION_PROVIDER_RESEND }),
      ).rejects.toThrow();
    });

    it("rate limits repeated tests", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "test-key" },
      });
      emailsList.mockResolvedValue({ data: [], error: null });

      // Default limit is 5 per minute.
      for (let i = 0; i < 5; i += 1) {
        await caller.test({ provider: INTEGRATION_PROVIDER_RESEND });
      }

      await expect(
        caller.test({ provider: INTEGRATION_PROVIDER_RESEND }),
      ).rejects.toThrow(/rate limit/i);
    });

    it("records an audit entry for a failed test", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "test-key" },
      });
      emailsList.mockResolvedValue({
        data: null,
        error: { message: "Invalid API key" },
      });

      await expect(
        caller.test({ provider: INTEGRATION_PROVIDER_RESEND }),
      ).rejects.toThrow();

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);

      const activity = await db.administrativeActivity.findFirst({
        where: { targetType: "INTEGRATION", action: "INTEGRATION_TESTED" },
      });
      expect(activity).not.toBeNull();
      activityIds.push(activity!.id);
      expect(activity!.outcome).toBe("FAILURE");
    });
  });

  describe("public revalidation", () => {
    it("revalidates the public root layout when a public integration is saved", async () => {
      await caller.update({
        provider: INTEGRATION_PROVIDER_GTM,
        config: gtmConfig,
      });
      integrationIds.push(
        (await db.integration.findFirstOrThrow({
          where: { provider: INTEGRATION_PROVIDER_GTM },
        })).id,
      );

      expect(revalidateContent).toHaveBeenCalledWith("settings");
    });

    it("revalidates the public root layout when a public integration is enabled or disabled", async () => {
      await createGtmIntegration({ isEnabled: false });

      await caller.setEnabled({
        provider: INTEGRATION_PROVIDER_GTM,
        isEnabled: true,
      });

      expect(revalidateContent).toHaveBeenCalledWith("settings");
    });

    it("revalidates Iubenda changes because it renders publicly", async () => {
      await caller.update({
        provider: INTEGRATION_PROVIDER_IUBENDA,
        config: iubendaConfig,
      });
      integrationIds.push(
        (await db.integration.findFirstOrThrow({
          where: { provider: INTEGRATION_PROVIDER_IUBENDA },
        })).id,
      );

      expect(revalidateContent).toHaveBeenCalledWith("settings");
    });

    it("revalidates Iubenda toggles because it renders publicly", async () => {
      await createIubendaIntegration({ isEnabled: false });

      await caller.setEnabled({
        provider: INTEGRATION_PROVIDER_IUBENDA,
        isEnabled: true,
      });

      expect(revalidateContent).toHaveBeenCalledWith("settings");
    });

    it("does not revalidate when an admin-only integration is saved", async () => {
      await createIntegration({ secrets: { apiKey: "test-key" } });

      await caller.update({
        provider: INTEGRATION_PROVIDER_RESEND,
        secrets: { apiKey: "updated-key" },
      });

      expect(revalidateContent).not.toHaveBeenCalled();
    });

    it("does not revalidate when an admin-only integration is toggled", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "test-key" },
      });

      await caller.setEnabled({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: false,
      });

      expect(revalidateContent).not.toHaveBeenCalled();
    });

    it("does not revalidate after a connection test", async () => {
      await createIntegration({
        isEnabled: true,
        secrets: { apiKey: "test-key" },
      });
      emailsList.mockResolvedValue({ data: [], error: null });

      await caller.test({ provider: INTEGRATION_PROVIDER_RESEND });

      expect(revalidateContent).not.toHaveBeenCalled();
    });
  });
});
