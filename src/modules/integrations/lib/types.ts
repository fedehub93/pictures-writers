import type { IntegrationProvider } from "./constants";
import type { GtmConfig } from "./providers/gtm-config";
import type { IubendaConfig } from "./providers/iubenda-config";
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
  /** Iubenda has no credentials; resolving secrets for it is a programming error. */
  iubenda: Record<string, never>;
  /** Google Tag Manager has no credentials; only a public container id. */
  gtm: Record<string, never>;
};

export type IntegrationSecrets<P extends IntegrationProvider> =
  IntegrationSecretsByProvider[P];

export type IntegrationPublicConfigByProvider = {
  resend: Record<string, unknown>;
  iubenda: IubendaConfig;
  gtm: GtmConfig;
};

export type IntegrationPublicConfig<P extends IntegrationProvider> =
  IntegrationPublicConfigByProvider[P];

export type IntegrationResolutionReason =
  | "not_configured"
  | "disabled"
  | "incomplete"
  | "undecryptable"
  | "no_secrets"
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
