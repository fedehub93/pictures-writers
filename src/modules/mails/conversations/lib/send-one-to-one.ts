import "server-only";

import { db } from "@/shared/lib/db";
import { getTodayEmailsAvailable } from "@/modules/mails/lib/mail";
import { resolveAdapter } from "@/modules/mails/lib/core";
import type {
  EmailProviderAdapter,
  OutboundAttachment,
} from "@/modules/mails/lib/types";

import { replySubject } from "./format";

export type ConversationSendErrorCode =
  | "NOT_FOUND"
  | "QUOTA_EXCEEDED"
  | "PROVIDER_ERROR";

export class ConversationSendError extends Error {
  constructor(
    message: string,
    public readonly code: ConversationSendErrorCode,
  ) {
    super(message);
  }
}

export interface SendConversationMessageInput {
  conversationId: string;
  bodyHtml: string;
  bodyText?: string;
  subject?: string;
  attachments?: OutboundAttachment[];
  /** Injected adapter for testing; resolved from settings otherwise. */
  adapter?: EmailProviderAdapter;
}

export interface SendConversationMessageResult {
  conversationId: string;
  messageId: string;
  providerId?: string;
}

/** Compose the provider `from` value from the account's display name. */
function resolveFrom(account: {
  name: string;
  displayName: string | null;
  email: string;
}): string {
  const displayName = account.displayName?.trim() || account.name.trim();
  return displayName ? `${displayName} <${account.email}>` : account.email;
}

/**
 * Send a one-to-one reply inside a conversation: enforce the transactional
 * quota, hand the message to the provider, then record the OUTBOUND
 * `EmailMessage` (with its attachments) and bump the conversation's activity.
 */
export async function sendConversationMessage(
  input: SendConversationMessageInput,
): Promise<SendConversationMessageResult> {
  const conversation = await db.conversation.findFirst({
    where: { id: input.conversationId, deletedAt: null },
    include: { emailAccount: true },
  });

  if (!conversation) {
    throw new ConversationSendError("Conversation not found", "NOT_FOUND");
  }

  const available = await getTodayEmailsAvailable();
  if (available <= 0) {
    throw new ConversationSendError(
      "The daily transactional email quota has been reached",
      "QUOTA_EXCEEDED",
    );
  }

  const adapter = input.adapter ?? (await resolveProviderAdapter());

  const account = conversation.emailAccount;
  const from = resolveFrom(account);

  const lastMessage = await db.emailMessage.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    select: { subject: true, messageId: true },
  });

  const subject = input.subject?.trim() || replySubject(lastMessage?.subject);

  const result = await adapter.sendOneToOne({
    to: conversation.contactEmail,
    from,
    subject,
    html: input.bodyHtml,
    text: input.bodyText,
    replyTo: account.email,
    attachments: input.attachments,
  });

  if (!result.success) {
    throw new ConversationSendError(result.error, "PROVIDER_ERROR");
  }

  const messageId = await db.$transaction(async (transaction) => {
    const message = await transaction.emailMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        status: "SENT",
        subject,
        bodyHtml: input.bodyHtml,
        bodyText: input.bodyText ?? null,
        fromAddress: from,
        toAddresses: [conversation.contactEmail],
        ccAddresses: [],
        bccAddresses: [],
        externalId: result.externalId ?? null,
        inReplyTo: lastMessage?.messageId ?? null,
        sentAt: new Date(),
        attachments: input.attachments?.length
          ? {
              create: input.attachments.map((attachment) => ({
                filename: attachment.filename,
                contentType: attachment.contentType,
                size: attachment.size ?? null,
                url: attachment.url,
              })),
            }
          : undefined,
      },
    });

    await transaction.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return message.id;
  });

  return {
    conversationId: conversation.id,
    messageId,
    providerId: result.externalId,
  };
}

/** Resolve the global provider adapter, failing with a typed error. */
async function resolveProviderAdapter(): Promise<EmailProviderAdapter> {
  try {
    return await resolveAdapter();
  } catch {
    throw new ConversationSendError(
      "The email provider is not configured",
      "PROVIDER_ERROR",
    );
  }
}
