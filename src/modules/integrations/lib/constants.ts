export const INTEGRATION_PROVIDER_RESEND = "resend";

export const INTEGRATION_PROVIDERS = [INTEGRATION_PROVIDER_RESEND] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return INTEGRATION_PROVIDERS.includes(value as IntegrationProvider);
}
