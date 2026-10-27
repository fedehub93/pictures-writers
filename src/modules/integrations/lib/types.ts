import type { IntegrationProvider } from "./constants";
import type { IntegrationSecretPresence } from "./providers/types";

/** Read-only projection of an integration row returned by the router. */
export interface IntegrationListItem {
  provider: IntegrationProvider;
  isEnabled: boolean;
  /** Non-secret provider configuration, validated by the provider schema. */
  config: Record<string, unknown>;
  /** Provider-agnostic presence summary. Never contains secret values. */
  secrets: IntegrationSecretPresence[];
  /** Whether the provider's enable rule is currently satisfied. */
  canEnable: boolean;
  hasConnectionTest: boolean;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
}

export type ResendIntegrationSecrets = {
  apiKey: string;
  webhookSecret?: string;
};

export type IntegrationSecretsByProvider = {
  resend: ResendIntegrationSecrets;
};

export type IntegrationSecrets<P extends IntegrationProvider> =
  IntegrationSecretsByProvider[P];

export type IntegrationResolutionReason =
  | "not_configured"
  | "disabled"
  | "incomplete"
  | "undecryptable"
  | "unknown_provider";

export class IntegrationResolutionError extends Error {
  readonly reason: IntegrationResolutionReason;

  constructor(message: string, reason: IntegrationResolutionReason) {
    super(message);
    this.name = "IntegrationResolutionError";
    this.reason = reason;
  }
}

export type IntegrationSecretsUpdate<T extends Record<string, string | undefined>> = Partial<
  Record<keyof T, string | null | undefined>
>;
