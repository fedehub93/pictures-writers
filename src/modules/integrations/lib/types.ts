import type { IntegrationProvider } from "./constants";

export type ResendIntegrationSecrets = {
  apiKey: string;
  webhookSecret?: string;
};

export type IntegrationSecretsByProvider = {
  resend: ResendIntegrationSecrets;
};

export type IntegrationSecrets<P extends IntegrationProvider> =
  IntegrationSecretsByProvider[P];

export class IntegrationResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationResolutionError";
  }
}

export type IntegrationSecretsUpdate<T extends Record<string, string | undefined>> = Partial<
  Record<keyof T, string | null | undefined>
>;
