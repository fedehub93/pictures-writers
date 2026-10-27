import "server-only";

import { TRPCError } from "@trpc/server";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { revalidateContent } from "@/shared/lib/revalidate-content";
import { recordAdministrativeActivity } from "@/modules/administrative-activity";
import type { Integration } from "@/generated/prisma";
import {
  createTRPCRouter,
  permissionProcedure,
} from "@/trpc/init";

import {
  INTEGRATION_PROVIDERS,
  applySecretsUpdate,
  decryptIntegrationSecrets,
  encryptIntegrationSecrets,
  getIntegrationSecretPresence,
  parseIntegrationConfig,
  withIntegrationResolutionCache,
  type IntegrationProvider,
  type IntegrationProviderDescriptor,
} from "@/modules/integrations/lib";

import { getServerIntegrationDescriptor } from "./descriptors";
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

const readProcedure = permissionProcedure(
  PERMISSIONS.INTEGRATIONS_READ,
).use(({ next }) => withIntegrationResolutionCache(() => next()));

const manageProcedure = permissionProcedure(
  PERMISSIONS.INTEGRATIONS_MANAGE,
).use(({ next }) => withIntegrationResolutionCache(() => next()));

function decryptSecretKeys(encrypted: string): string[] {
  try {
    const secrets = decryptIntegrationSecrets(encrypted);
    return Object.entries(secrets)
      .filter(([, value]) => value.length > 0)
      .map(([key]) => key);
  } catch {
    return [];
  }
}

function decryptSecretsOrThrow(row: Integration): Record<string, string> {
  try {
    return decryptIntegrationSecrets(row.secretEncrypted);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to decrypt integration secrets: ${message}`,
    });
  }
}

function toIntegrationListItem(
  provider: IntegrationProvider,
  row?: Integration | null,
) {
  const descriptor = getServerIntegrationDescriptor(provider);
  const config = parseIntegrationConfig(descriptor, row?.config);
  const secretKeys = row ? decryptSecretKeys(row.secretEncrypted) : [];

  return {
    provider,
    isEnabled: row?.isEnabled ?? false,
    config,
    secrets: getIntegrationSecretPresence(descriptor, secretKeys),
    canEnable: descriptor.isReady({ config, secretKeys }),
    hasConnectionTest: Boolean(descriptor.connectionTest),
    lastTestedAt: row?.lastTestedAt ?? null,
    lastTestStatus: row?.lastTestStatus ?? null,
  };
}

function buildAuditPayload(row: Integration) {
  return buildIntegrationAuditPayload(row, decryptSecretKeys(row.secretEncrypted));
}

async function findIntegration(
  provider: IntegrationProvider,
): Promise<Integration | null> {
  return db.integration.findUnique({ where: { provider } });
}

async function getIntegrationOrThrow(provider: IntegrationProvider) {
  const row = await db.integration.findUnique({ where: { provider } });
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Integration ${provider} not found`,
    });
  }
  return row;
}

/**
 * Integrations render from the public root layout, so every mutation must
 * invalidate it for the next request.
 */
function revalidatePublicIntegrations() {
  revalidateContent("settings");
}

function assertCanEnable(
  descriptor: IntegrationProviderDescriptor,
  config: Record<string, unknown>,
  secretKeys: readonly string[],
) {
  if (!descriptor.isReady({ config, secretKeys })) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Integration ${descriptor.provider} cannot be enabled: required configuration or credentials are missing`,
    });
  }
}

function parseConfigOrThrow(
  descriptor: IntegrationProviderDescriptor,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = descriptor.configSchema.safeParse(config);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid configuration for ${descriptor.provider}`,
    });
  }
  return parsed.data;
}

function parseSecretsOrThrow(
  descriptor: IntegrationProviderDescriptor,
  secrets: Record<string, string>,
): Record<string, string> {
  if (!descriptor.secretsSchema) {
    return secrets;
  }

  const parsed = descriptor.secretsSchema.safeParse(secrets);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid credentials for ${descriptor.provider}`,
    });
  }
  return Object.fromEntries(
    Object.entries(parsed.data).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

async function upsertIntegration(
  descriptor: IntegrationProviderDescriptor,
  existing: Integration | null,
  data: {
    isEnabled?: boolean;
    config?: Record<string, unknown>;
    secrets?: Record<string, string | null | undefined>;
  },
) {
  const provider = descriptor.provider;

  const currentConfig = parseIntegrationConfig(descriptor, existing?.config);
  const nextConfig =
    data.config !== undefined
      ? parseConfigOrThrow(descriptor, data.config)
      : currentConfig;

  const currentSecrets = existing
    ? decryptSecretsOrThrow(existing)
    : ({} as Record<string, string>);

  let nextSecrets: Record<string, string> = currentSecrets;
  if (data.secrets) {
    const allowedKeys = new Set(
      descriptor.secretFields.map((field) => field.key),
    );
    const scopedUpdate = Object.fromEntries(
      Object.entries(data.secrets).filter(([key]) => allowedKeys.has(key)),
    );
    nextSecrets = parseSecretsOrThrow(
      descriptor,
      applySecretsUpdate(currentSecrets, scopedUpdate),
    );
  }

  const nextEnabled = data.isEnabled ?? existing?.isEnabled ?? false;
  if (nextEnabled) {
    const validatedSecrets = parseSecretsOrThrow(descriptor, nextSecrets);
    assertCanEnable(descriptor, nextConfig, Object.keys(validatedSecrets));
  }

  return db.integration.upsert({
    where: { provider },
    create: {
      provider,
      isEnabled: nextEnabled,
      config: nextConfig,
      secretEncrypted: encryptIntegrationSecrets(nextSecrets),
    },
    update: {
      isEnabled: data.isEnabled,
      config: nextConfig,
      secretEncrypted: encryptIntegrationSecrets(nextSecrets),
    },
  });
}

export const integrationsRouter = createTRPCRouter({
  getMany: readProcedure.query(async () => {
    const rows = await db.integration.findMany({
      orderBy: { provider: "asc" },
    });

    const rowByProvider = new Map(rows.map((row) => [row.provider, row]));

    return INTEGRATION_PROVIDERS.map((provider) =>
      toIntegrationListItem(provider, rowByProvider.get(provider)),
    );
  }),

  update: manageProcedure
    .input(integrationUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const descriptor = getServerIntegrationDescriptor(input.provider);
      const existing = await findIntegration(input.provider);
      const before = existing ? buildAuditPayload(existing) : undefined;

      const updated = await upsertIntegration(descriptor, existing, {
        isEnabled: input.isEnabled,
        config: input.config,
        secrets: input.secrets,
      });

      const after = buildAuditPayload(updated);

      await recordAdministrativeActivity(db, {
        actorId: ctx.auth.id,
        ...buildIntegrationActivityInput({
          action: existing ? "INTEGRATION_UPDATED" : "INTEGRATION_CREATED",
          targetId: updated.id,
          outcome: "SUCCESS",
          before,
          after,
        }),
      });

      revalidatePublicIntegrations();

      return toIntegrationListItem(input.provider, updated);
    }),

  setEnabled: manageProcedure
    .input(integrationSetEnabledSchema)
    .mutation(async ({ input, ctx }) => {
      const descriptor = getServerIntegrationDescriptor(input.provider);
      const row = await getIntegrationOrThrow(input.provider);
      const before = buildAuditPayload(row);

      if (input.isEnabled) {
        const config = parseIntegrationConfig(descriptor, row.config);
        const secrets = parseSecretsOrThrow(
          descriptor,
          decryptSecretsOrThrow(row),
        );
        assertCanEnable(descriptor, config, Object.keys(secrets));
      }

      const updated = await db.integration.update({
        where: { provider: input.provider },
        data: { isEnabled: input.isEnabled },
      });

      const after = buildAuditPayload(updated);

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

      revalidatePublicIntegrations();

      return toIntegrationListItem(input.provider, updated);
    }),

  test: manageProcedure
    .input(integrationProviderParamSchema)
    .mutation(async ({ input, ctx }) => {
      const descriptor = getServerIntegrationDescriptor(input.provider);
      const connectionTest = descriptor.connectionTest;
      if (!connectionTest) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Connection test is not supported for provider ${input.provider}`,
        });
      }

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

      const config = parseIntegrationConfig(descriptor, row.config);
      const secrets = parseSecretsOrThrow(
        descriptor,
        decryptSecretsOrThrow(row),
      );

      if (!descriptor.isReady({ config, secretKeys: Object.keys(secrets) })) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Integration ${input.provider} is missing required credentials`,
        });
      }

      let testResult: Awaited<ReturnType<typeof connectionTest>>;
      try {
        testResult = await connectionTest({ config, secrets });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        testResult = { success: false, error: message };
      }

      const status = testResult.success ? "SUCCESS" : "FAILURE";
      const updated = await db.integration.update({
        where: { provider: input.provider },
        data: {
          lastTestedAt: new Date(),
          lastTestStatus: status,
        },
      });

      const after = buildAuditPayload(updated);

      await recordAdministrativeActivity(db, {
        actorId: ctx.auth.id,
        ...buildIntegrationActivityInput({
          action: "INTEGRATION_TESTED",
          targetId: updated.id,
          outcome: status,
          after,
        }),
      });

      revalidatePublicIntegrations();

      if (!testResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: testResult.error ?? "Connection test failed",
        });
      }

      return toIntegrationListItem(input.provider, updated);
    }),
});
