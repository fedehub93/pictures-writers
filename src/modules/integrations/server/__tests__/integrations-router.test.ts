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

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { list: emailsList } };
  }),
}));

import { createCallerFactory } from "@/trpc/init";

import { db } from "@/shared/lib/db";

import {
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

const originalResendKey = process.env.NEXT_RESEND_KEY;
const originalWebhookSecret = process.env.NEXT_RESEND_WEBHOOK_SECRET;
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
  secrets?: { apiKey?: string; webhookSecret?: string };
  lastTestedAt?: Date;
  lastTestStatus?: string;
} = {}) {
  const integration = await db.integration.create({
    data: {
      provider: INTEGRATION_PROVIDER_RESEND,
      isEnabled: overrides.isEnabled ?? false,
      secretEncrypted: encryptIntegrationSecrets(overrides.secrets ?? {}),
      lastTestedAt: overrides.lastTestedAt ?? null,
      lastTestStatus: overrides.lastTestStatus ?? null,
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
  process.env.NEXT_RESEND_KEY = "env-resend-key";
  delete process.env.NEXT_RESEND_WEBHOOK_SECRET;

  resetIntegrationTestRateLimit(INTEGRATION_PROVIDER_RESEND);
  emailsList.mockReset();

  const user = await createUser();
  caller = createCaller({ userId: user.id, auth: { id: user.id } });

  await db.integration.deleteMany({
    where: { provider: INTEGRATION_PROVIDER_RESEND },
  });
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

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: true,
        hasApiKey: true,
        hasWebhookSecret: false,
        lastTestStatus: "SUCCESS",
      });
      expect(result[0]!.lastTestedAt).toBeInstanceOf(Date);
    });

    it("returns an unconfigured entry when no integration row exists", async () => {
      const result = await caller.getMany();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        provider: INTEGRATION_PROVIDER_RESEND,
        isEnabled: false,
        hasApiKey: false,
        hasWebhookSecret: false,
        lastTestedAt: null,
        lastTestStatus: null,
      });
    });

    it("never returns secret values or ciphertext", async () => {
      await createIntegration({
        secrets: { apiKey: "secret-key", webhookSecret: "secret-webhook" },
      });

      const result = await caller.getMany();

      const keys = Object.keys(result[0]!);
      expect(keys).not.toContain("secretEncrypted");
      expect(keys).not.toContain("apiKey");
      expect(keys).not.toContain("webhookSecret");
      expect(result[0]).toMatchObject({
        hasApiKey: true,
        hasWebhookSecret: true,
      });
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
      expect(updated.hasApiKey).toBe(true);
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
      expect(after.hasApiKey).toBe(true);
      expect(Object.keys(after)).not.toContain("apiKey");
      expect(Object.keys(after)).not.toContain("secretEncrypted");
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

    it("records an audit entry for enable/disable", async () => {
      const integration = await createIntegration({ isEnabled: false });

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
  });

  describe("importFromEnv", () => {
    it("copies environment credentials into the integration without returning them", async () => {
      process.env.NEXT_RESEND_KEY = "imported-key";
      process.env.NEXT_RESEND_WEBHOOK_SECRET = "imported-secret";

      const result = await caller.importFromEnv({
        provider: INTEGRATION_PROVIDER_RESEND,
      });

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);

      expect(result.hasApiKey).toBe(true);
      expect(result.hasWebhookSecret).toBe(true);
      expect(result.isEnabled).toBe(true);
      expect(row.isEnabled).toBe(true);
    });

    it("throws when the environment key is missing", async () => {
      delete process.env.NEXT_RESEND_KEY;

      await expect(
        caller.importFromEnv({ provider: INTEGRATION_PROVIDER_RESEND }),
      ).rejects.toThrow();
    });

    it("records an audit entry without secret values", async () => {
      process.env.NEXT_RESEND_KEY = "imported-key";

      await caller.importFromEnv({ provider: INTEGRATION_PROVIDER_RESEND });

      const row = await db.integration.findFirstOrThrow();
      integrationIds.push(row.id);

      const activity = await db.administrativeActivity.findFirst({
        where: { targetType: "INTEGRATION", action: "INTEGRATION_IMPORTED" },
      });
      expect(activity).not.toBeNull();
      activityIds.push(activity!.id);

      const after = activity!.after as Record<string, unknown>;
      expect(Object.keys(after)).not.toContain("apiKey");
      expect(Object.keys(after)).not.toContain("webhookSecret");
      expect(Object.keys(after)).not.toContain("secretEncrypted");
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
});
