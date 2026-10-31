export {
  INTEGRATION_PROVIDER_GTM,
  INTEGRATION_PROVIDER_IUBENDA,
  INTEGRATION_PROVIDER_RESEND,
  INTEGRATION_PROVIDERS,
  isIntegrationProvider,
} from "./constants";
export type { IntegrationProvider } from "./constants";

export type { GtmConfig } from "./providers/gtm-config";

export {
  encryptIntegrationSecrets,
  decryptIntegrationSecrets,
  applySecretsUpdate,
} from "./secrets";

export { resolveIntegrationSecrets } from "./resolution";

export { resolveIntegrationPublicConfig } from "./public-config";

export { withIntegrationResolutionCache } from "./resolution-cache";

export {
  INTEGRATION_DESCRIPTORS,
  getIntegrationDescriptor,
  getIntegrationSecretPresence,
  parseIntegrationConfig,
} from "./providers";
export type {
  IntegrationConnectionTest,
  IntegrationConnectionTestContext,
  IntegrationConnectionTestResult,
  IntegrationProviderDescriptor,
  IntegrationProviderFormProps,
  IntegrationProviderFormValues,
  IntegrationProviderPresentation,
  IntegrationSecretField,
  IntegrationSecretPresence,
} from "./providers";

export type {
  IntegrationListItem,
  IntegrationPublicConfig,
  IntegrationPublicConfigByProvider,
  ResendIntegrationSecrets,
  IntegrationSecretsByProvider,
  IntegrationSecrets,
  IntegrationSecretsUpdate,
  IntegrationResolutionReason,
} from "./types";
export { IntegrationResolutionError } from "./types";
