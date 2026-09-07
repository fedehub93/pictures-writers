import { db } from "@/shared/lib/db";
import { EmailProviderAdapter } from "./types";
import { ResendAdapter } from "./adapters/resend-adapter";

// Factory Helper per isolare lo switch dei provider
export function getProviderAdapter(providerType: string): EmailProviderAdapter {
  switch (providerType) {
    case "RESEND":
      return new ResendAdapter();
    case "SENDGRID":
      throw new Error("SendGrid is not integrated yet");
    default:
      throw new Error("Provider not supported");
  }
}

/**
 * Resolve the configured email provider adapter from the EmailSetting row.
 * Throws if the settings are missing or no provider is configured.
 */
export async function resolveAdapter(): Promise<EmailProviderAdapter> {
  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }
  return getProviderAdapter(emailSettings.emailProvider);
}
