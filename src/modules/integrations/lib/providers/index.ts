import type { IntegrationProvider } from "../constants";
import { iubendaIntegrationDescriptor } from "./iubenda";
import { resendIntegrationDescriptor } from "./resend";
import type {
  IntegrationProviderDescriptor,
  IntegrationSecretPresence,
} from "./types";

/**
 * The shared provider catalog. The generic CRUD, schema, list projection and
 * admin surface read this map; adding a provider means adding its descriptor
 * here (plus an optional server connection test and setup guide).
 */
export const INTEGRATION_DESCRIPTORS = {
  resend: resendIntegrationDescriptor,
  iubenda: iubendaIntegrationDescriptor,
} satisfies Record<IntegrationProvider, IntegrationProviderDescriptor>;

export function getIntegrationDescriptor(
  provider: IntegrationProvider,
): IntegrationProviderDescriptor {
  return INTEGRATION_DESCRIPTORS[provider];
}

/**
 * Read a provider's non-secret configuration through its own schema.
 *
 * Invalid or missing values degrade to an empty configuration instead of
 * throwing: reads must be safe for half-configured rows.
 */
export function parseIntegrationConfig(
  descriptor: IntegrationProviderDescriptor,
  raw: unknown,
): Record<string, unknown> {
  const parsed = descriptor.configSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : {};
}

/** Map the stored secret keys onto a provider-agnostic presence list. */
export function getIntegrationSecretPresence(
  descriptor: IntegrationProviderDescriptor,
  secretKeys: readonly string[],
): IntegrationSecretPresence[] {
  return descriptor.secretFields.map((field) => ({
    key: field.key,
    label: field.label,
    required: field.required,
    present: secretKeys.includes(field.key),
  }));
}

export type {
  IntegrationConfigSchema,
  IntegrationConnectionTest,
  IntegrationConnectionTestContext,
  IntegrationConnectionTestResult,
  IntegrationEnableContext,
  IntegrationProviderDescriptor,
  IntegrationProviderFormProps,
  IntegrationProviderFormValues,
  IntegrationProviderPresentation,
  IntegrationSecretField,
  IntegrationSecretPresence,
  IntegrationSecretsSchema,
} from "./types";
