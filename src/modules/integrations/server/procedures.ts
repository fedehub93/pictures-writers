import "server-only";

import { TRPCError } from "@trpc/server";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { recordAdministrativeActivity } from "@/modules/administrative-activity";
import type { Integration } from "@/generated/prisma";
import {
  createTRPCRouter,
  permissionProcedure,
} from "@/trpc/init";

import {
  INTEGRATION_PROVIDER_RESEND,
  encryptIntegrationSecrets,
  decryptIntegrationSecrets,
  applySecretsUpdate,
  withIntegrationResolutionCache,
  invalidateCachedIntegrationSecrets,
  type IntegrationProvider,
  type ResendIntegrationSecrets,
} from "@/modules/integrations/lib";

import { testResendConnection } from "./lib/test-resend";
import {
  checkIntegrationTestRateLimit,
  resetIntegrationTestRateLimit,
} from "./lib/rate-limit";
import {
  buildIntegrationActivityInput,
  buildIntegrationAuditPayload,
} from "./lib/audit";
import {
  integrationProviderParamSchema,
  integrationSetEnabledSchema,
  integrationUpdateSchema,
} from "./schemas";

export { resetIntegrationTestRateLimit };

const RESEND_ENV_KEY = "NEXT_RESEND_KEY";
const RESEND_WEBHOOK_SECRET_ENV_KEY = "NEXT_RESEND_WEBHOOK_SECRET";

const readProcedure = permissionProcedure(
  PERMISSIONS.INTEGRATIONS_READ,
).use(({ next }) => withIntegrationResolutionCache(() => next()));

const manageProcedure = permissionProcedure(
  PERMISSIONS.INTEGRATIONS_MANAGE,
).use(({ next }) => withIntegrationResolutionCache(() => next()));

function decryptSecretKeys(encrypted: string): string[] {
  try {
    const secrets = decryptIntegrationSecrets(encrypted);
    return Object.keys(secrets);
  } catch {
    return [];
  }
}

function toIntegrationListItem(
  provider: IntegrationProvider,
  row?: Integration | null,
) {
  const secretKeys = row ? decryptSecretKeys(row.secretEncrypted) : [];
  return {
    provider,
    isEnabled: row?.isEnabled ?? false,
    hasApiKey: secretKeys.includes("apiKey"),
    hasWebhookSecret: secretKeys.includes("webhookSecret"),
    lastTestedAt: row?.lastTestedAt ?? null,
    lastTestStatus: row?.lastTestStatus ?? null,
  };
}

function buildAuditPayload(row: Awaited<ReturnType<typeof findOrBuildIntegration>>) {
  if (!row) return undefined;
  return buildIntegrationAuditPayload(row, decryptSecretKeys(row.secretEncrypted));
}

async function findOrBuildIntegration(provider: string): Promise<Integration> {
  return (
    (await db.integration.findUnique({ where: { provider } })) ??
    ({
      id: "",
      provider,
      isEnabled: false,
      secretEncrypted: encryptIntegrationSecrets({}),
      lastTestedAt: null,
      lastTestStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Integration)
  );
}

async function getIntegrationOrThrow(provider: string) {
  const row = await db.integration.findUnique({ where: { provider } });
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Integration ${provider} not found`,
    });
  }
  return row;
}

async function upsertIntegration(
  provider: IntegrationProvider,
  data: {
    isEnabled?: boolean;
    secrets?: Partial<Record<keyof ResendIntegrationSecrets, string | null | undefined>>;
  },
) {
  const existing = await db.integration.findUnique({ where: { provider } });

  const currentSecrets: Partial<ResendIntegrationSecrets> = existing
    ? (decryptIntegrationSecrets(existing.secretEncrypted) as Partial<ResendIntegrationSecrets>)
    : {};

  const nextSecrets = data.secrets
    ? applySecretsUpdate(currentSecrets as ResendIntegrationSecrets, data.secrets)
    : (currentSecrets as ResendIntegrationSecrets);

  return db.integration.upsert({
    where: { provider },
    create: {
      provider,
      isEnabled: data.isEnabled ?? false,
      secretEncrypted: encryptIntegrationSecrets(nextSecrets),
    },
    update: {
      isEnabled: data.isEnabled,
      secretEncrypted: encryptIntegrationSecrets(nextSecrets),
    },
  });
}

export const integrationsRouter = createTRPCRouter({
  getMany: readProcedure.query(async () => {
    const rows = await db.integration.findMany({
      orderBy: { provider: "asc" },
    });

    const knownProviders: IntegrationProvider[] = [INTEGRATION_PROVIDER_RESEND];
    const rowByProvider = new Map(rows.map((row) => [row.provider, row]));

    return knownProviders.map((provider) =>
      toIntegrationListItem(provider, rowByProvider.get(provider)),
    );
  }),

  update: manageProcedure
    .input(integrationUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const beforeRow = await findOrBuildIntegration(input.provider);
      const before = buildAuditPayload(beforeRow);

      const updated = await upsertIntegration(input.provider, {
        isEnabled: input.isEnabled,
        secrets: input.secrets,
      });

      const after = buildIntegrationAuditPayload(
        updated,
        decryptSecretKeys(updated.secretEncrypted),
      );

      await recordAdministrativeActivity(db, {
        actorId: ctx.auth.id,
        ...buildIntegrationActivityInput({
          action: beforeRow.id ? "INTEGRATION_UPDATED" : "INTEGRATION_CREATED",
          targetId: updated.id,
          outcome: "SUCCESS",
          before,
          after,
        }),
      });

      return toIntegrationListItem(input.provider, updated);
    }),

  setEnabled: manageProcedure
    .input(integrationSetEnabledSchema)
    .mutation(async ({ input, ctx }) => {
      const row = await getIntegrationOrThrow(input.provider);
      const before = buildAuditPayload(row);

      const updated = await db.integration.update({
        where: { provider: input.provider },
        data: { isEnabled: input.isEnabled },
      });

      const after = buildIntegrationAuditPayload(
        updated,
        decryptSecretKeys(updated.secretEncrypted),
      );

      await recordAdministrativeActivity(db, {
        actorId: ctx.auth.id,
        ...buildIntegrationActivityInput({
          action: input.isEnabled ? "INTEGRATION_ENABLED" : "INTEGRATION_DISABLED",
          targetId: updated.id,
          outcome: "SUCCESS",
          before,
          after,
        }),
      });

      return toIntegrationListItem(input.provider, updated);
    }),

  importFromEnv: manageProcedure
    .input(integrationProviderParamSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.provider !== INTEGRATION_PROVIDER_RESEND) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Provider ${input.provider} does not support environment import`,
        });
      }

      const apiKey = process.env[RESEND_ENV_KEY];
      if (!apiKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Environment variable ${RESEND_ENV_KEY} is not set`,
        });
      }

      const beforeRow = await findOrBuildIntegration(input.provider);
      const before = buildAuditPayload(beforeRow);

      const updated = await upsertIntegration(input.provider, {
        isEnabled: true,
        secrets: {
          apiKey,
          webhookSecret: process.env[RESEND_WEBHOOK_SECRET_ENV_KEY],
        },
      });

      invalidateCachedIntegrationSecrets(input.provider);

      const after = buildIntegrationAuditPayload(
        updated,
        decryptSecretKeys(updated.secretEncrypted),
      );

      await recordAdministrativeActivity(db, {
        actorId: ctx.auth.id,
        ...buildIntegrationActivityInput({
          action: "INTEGRATION_IMPORTED",
          targetId: updated.id,
          outcome: "SUCCESS",
          before,
          after,
        }),
      });

      return toIntegrationListItem(input.provider, updated);
    }),

  test: manageProcedure
    .input(integrationProviderParamSchema)
    .mutation(async ({ input, ctx }) => {
      const rateLimit = checkIntegrationTestRateLimit(input.provider);
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limit exceeded for ${input.provider}. Try again later.`,
        });
      }

      const row = await getIntegrationOrThrow(input.provider);
      if (!row.isEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Integration ${input.provider} is disabled`,
        });
      }

      let secrets: ResendIntegrationSecrets;
      try {
        secrets = decryptIntegrationSecrets(row.secretEncrypted) as ResendIntegrationSecrets;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to decrypt integration secrets: ${message}`,
        });
      }

      if (!secrets.apiKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Integration ${input.provider} is missing an API key`,
        });
      }

      if (input.provider !== INTEGRATION_PROVIDER_RESEND) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Connection test is not supported for provider ${input.provider}`,
        });
      }

      const testResult = await testResendConnection(secrets.apiKey);

      const status = testResult.success ? "SUCCESS" : "FAILURE";
      const updated = await db.integration.update({
        where: { provider: input.provider },
        data: {
          lastTestedAt: new Date(),
          lastTestStatus: status,
        },
      });

      const after = buildIntegrationAuditPayload(
        updated,
        decryptSecretKeys(updated.secretEncrypted),
      );

      await recordAdministrativeActivity(db, {
        actorId: ctx.auth.id,
        ...buildIntegrationActivityInput({
          action: "INTEGRATION_TESTED",
          targetId: updated.id,
          outcome: status,
          after,
        }),
      });

      if (!testResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: testResult.error ?? "Connection test failed",
        });
      }

      return toIntegrationListItem(input.provider, updated);
    }),
});
