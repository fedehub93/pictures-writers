import "server-only";

import { EmailProvider } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import {
  INTEGRATION_PROVIDER_RESEND,
  resolveIntegrationSecrets,
} from "@/modules/integrations/lib";

import { EmailProviderAdapter } from "./types";
import { ResendAdapter } from "./adapters/resend-adapter";

export type ProviderCredentials = {
  apiKey: string;
};

type ProviderHandler = {
  resolveCredentials: () => Promise<ProviderCredentials>;
  buildAdapter: (credentials: ProviderCredentials) => EmailProviderAdapter;
};

const providerHandlers: Record<EmailProvider, ProviderHandler> = {
  [EmailProvider.RESEND]: {
    resolveCredentials: async () => {
      const secrets = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);
      return { apiKey: secrets.apiKey };
    },
    buildAdapter: (credentials) => new ResendAdapter({ apiKey: credentials.apiKey }),
  },
  [EmailProvider.SENDGRID]: {
    resolveCredentials: async () => {
      throw new Error("SendGrid is not integrated yet");
    },
    buildAdapter: () => {
      throw new Error("SendGrid is not integrated yet");
    },
  },
};

// Factory Helper per isolare lo switch dei provider
export function getProviderAdapter(
  providerType: EmailProvider,
  credentials: ProviderCredentials,
): EmailProviderAdapter {
  return providerHandlers[providerType].buildAdapter(credentials);
}

/**
 * Resolve the configured email provider adapter from the EmailSetting row,
 * reading provider credentials from the Integration store.
 *
 * Throws if settings are missing, no provider is configured, or credential
 * resolution fails (disabled integration, missing secret, etc.).
 */
export async function resolveAdapter(): Promise<EmailProviderAdapter> {
  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }

  const handler = providerHandlers[emailSettings.emailProvider];
  const credentials = await handler.resolveCredentials();
  return handler.buildAdapter(credentials);
}
