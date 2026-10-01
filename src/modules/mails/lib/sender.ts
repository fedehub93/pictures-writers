/**
 * Builds the RFC 5322 `From` header from the configured email settings,
 * combining the optional display name with the sender address:
 * `"Display Name" <address>` (or the bare address when no name is set).
 *
 * Shared by every outbound flow so the sender shown to recipients is
 * consistent across transcripts, automations and campaigns.
 */
export function resolveSender(settings: {
  emailSender?: string | null;
  emailSenderName?: string | null;
}): string | null {
  if (!settings.emailSender) {
    return null;
  }

  return settings.emailSenderName
    ? `${settings.emailSenderName} <${settings.emailSender}>`
    : settings.emailSender;
}
