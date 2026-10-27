import "server-only";

import type { IntegrationProvider } from "@/modules/integrations/lib/constants";
import type { IntegrationProviderDescriptor } from "@/modules/integrations/lib/providers/types";
import { resendIntegrationDescriptor } from "@/modules/integrations/lib/providers/resend";

import { testResendConnection } from "./lib/test-resend";

/**
 * Complete server-side descriptors. They extend the shared descriptors with
 * the optional connection test, which must stay out of client bundles.
 */
const SERVER_DESCRIPTORS = {
  resend: {
    ...resendIntegrationDescriptor,
    connectionTest: ({ secrets }) =>
      testResendConnection(secrets.apiKey ?? ""),
  },
} satisfies Record<IntegrationProvider, IntegrationProviderDescriptor>;

export function getServerIntegrationDescriptor(
  provider: IntegrationProvider,
): IntegrationProviderDescriptor {
  return SERVER_DESCRIPTORS[provider];
}
