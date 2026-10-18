import "server-only";

import { db } from "@/shared/lib/db";

import { INTEGRATION_PROVIDER_RESEND, type IntegrationProvider } from "./constants";
import { decryptIntegrationSecrets } from "./secrets";
import {
  IntegrationResolutionError,
  type IntegrationSecrets,
  type IntegrationSecretsByProvider,
  type ResendIntegrationSecrets,
} from "./types";

type Resolver<P extends IntegrationProvider> = () => Promise<IntegrationSecretsByProvider[P]>;

async function resolveResendSecrets(): Promise<IntegrationSecretsByProvider["resend"]> {
  const row = await db.integration.findUnique({
    where: { provider: INTEGRATION_PROVIDER_RESEND },
  });

  if (!row) {
    const apiKey = process.env.NEXT_RESEND_KEY;
    if (!apiKey) {
      throw new IntegrationResolutionError(
        "Resend API key is not configured (no integration row and NEXT_RESEND_KEY is missing)",
      );
    }
    return {
      apiKey,
      webhookSecret: process.env.NEXT_RESEND_WEBHOOK_SECRET,
    };
  }

  if (!row.isEnabled) {
    throw new IntegrationResolutionError("Resend integration is disabled");
  }

  let secrets: ResendIntegrationSecrets;
  try {
    secrets = decryptIntegrationSecrets(row.secretEncrypted) as ResendIntegrationSecrets;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new IntegrationResolutionError(
      `Resend integration secrets cannot be decrypted: ${message}`,
    );
  }

  const apiKey = secrets.apiKey;
  if (!apiKey) {
    throw new IntegrationResolutionError("Resend integration is incomplete: apiKey is required");
  }

  return {
    apiKey,
    webhookSecret: secrets.webhookSecret,
  };
}

const resolvers: {
  [P in IntegrationProvider]: Resolver<P>;
} = {
  [INTEGRATION_PROVIDER_RESEND]: resolveResendSecrets,
};

/**
 * Resolve decrypted secrets for a configured integration provider.
 *
 * - No integration row → falls back to the legacy environment variables.
 * - Disabled row → throws an explicit error.
 * - Enabled but incomplete row → throws an explicit error naming the missing
 *   field.
 * - Malformed ciphertext → throws an explicit error.
 *
 * Resolution is not cached across requests. Callers that need per-request
 * memoization should wrap this function and invalidate it explicitly.
 */
export async function resolveIntegrationSecrets<P extends IntegrationProvider>(
  provider: P,
): Promise<IntegrationSecrets<P>> {
  const resolver = resolvers[provider];
  if (!resolver) {
    throw new IntegrationResolutionError(`Unknown integration provider: ${provider}`);
  }
  return resolver();
}
