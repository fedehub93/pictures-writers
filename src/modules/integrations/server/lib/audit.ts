import "server-only";

import type { Integration } from "@/generated/prisma";
import type { ActivityInput, ActivityData } from "@/modules/administrative-activity";

export type IntegrationAuditAction =
  | "INTEGRATION_CREATED"
  | "INTEGRATION_UPDATED"
  | "INTEGRATION_ENABLED"
  | "INTEGRATION_DISABLED"
  | "INTEGRATION_TESTED";

/**
 * Build an audit payload for an Integration row.
 *
 * This never includes secret values or ciphertext. It exposes the non-secret
 * configuration, which secret keys are present, and the last test result.
 */
export function buildIntegrationAuditPayload(
  row: Integration,
  secretKeys: string[],
): ActivityData {
  return {
    provider: row.provider,
    isEnabled: row.isEnabled,
    config: row.config as ActivityData,
    secretKeys,
    lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
    lastTestStatus: row.lastTestStatus ?? null,
  };
}

export function buildIntegrationActivityInput(
  input: Omit<ActivityInput, "area" | "targetType"> & {
    action: IntegrationAuditAction;
  },
): ActivityInput {
  return {
    ...input,
    area: "INTEGRATIONS",
    targetType: "INTEGRATION",
    // Integration config is non-secret provider configuration.
    preserveKeys: ["config"],
  };
}
