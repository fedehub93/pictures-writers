import "server-only";

import { getTodayEmailsAvailable } from "@/modules/mails/lib/mail";
import { resolveAdapter } from "@/modules/mails/lib/core";
import type {
  EmailProviderAdapter,
  OutboundAttachment,
} from "@/modules/mails/lib/types";

/** Throw a caller-provided typed error when no transactional quota remains. */
export async function assertTransactionalQuota(
  makeError: (message: string) => Error,
): Promise<void> {
  const available = await getTodayEmailsAvailable();
  if (available <= 0) {
    throw makeError("The daily transactional email quota has been reached");
  }
}

/** Resolve the global provider adapter, failing with a caller-provided error. */
export async function resolveProviderAdapter(
  makeError: (message: string) => Error,
): Promise<EmailProviderAdapter> {
  try {
    return await resolveAdapter();
  } catch {
    throw makeError("The email provider is not configured");
  }
}

export interface OutboundMessageFields {
  conversationId: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  fromAddress: string;
  toAddresses: string[];
  externalId?: string | null;
  inReplyTo?: string | null;
  attachments?: OutboundAttachment[];
  sentAt: Date;
}

/** Build the Prisma `data` for an OUTBOUND / `SENT` `EmailMessage` and its files. */
export function outboundMessageCreateData(fields: OutboundMessageFields) {
  return {
    conversationId: fields.conversationId,
    direction: "OUTBOUND" as const,
    status: "SENT" as const,
    subject: fields.subject,
    bodyHtml: fields.bodyHtml,
    bodyText: fields.bodyText ?? null,
    fromAddress: fields.fromAddress,
    toAddresses: fields.toAddresses,
    ccAddresses: [],
    bccAddresses: [],
    externalId: fields.externalId ?? null,
    inReplyTo: fields.inReplyTo ?? null,
    sentAt: fields.sentAt,
    attachments: fields.attachments?.length
      ? {
          create: fields.attachments.map((attachment) => ({
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size ?? null,
            url: attachment.url,
          })),
        }
      : undefined,
  };
}
