import "server-only";

import type { Integration } from "@/generated/prisma";
import type { ActivityInput, ActivityData } from "@/modules/administrative-activity";

export type IntegrationAuditAction =
  | "INTEGRATION_CREATED"
  | "INTEGRATION_UPDATED"
  | "INTEGRATION_ENABLED"
  | "INTEGRATION_DISABLED"
  | "INTEGRATION_TESTED";

export interface IntegrationAuditPayload {
  [key: string]: string | number | boolean | null;
  provider: string;
  isEnabled: boolean;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
}

/**
 * Build an audit payload for an Integration row.
 *
 * This never includes secret values or ciphertext. It only exposes metadata
 * (enabled state, which secret keys are present, last test result).
 */
export function buildIntegrationAuditPayload(
  row: Integration,
  secretKeys: string[],
): ActivityData {
  const payload: IntegrationAuditPayload = {
    provider: row.provider,
    isEnabled: row.isEnabled,
    hasApiKey: secretKeys.includes("apiKey"),
    hasWebhookSecret: secretKeys.includes("webhookSecret"),
    lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
    lastTestStatus: row.lastTestStatus ?? null,
  };
  return payload as ActivityData;
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
  };
}
