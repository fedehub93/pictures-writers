import "server-only";

import { db } from "@/shared/lib/db";
import { htmlToPlainText } from "@/modules/mails/lib/html-to-text";
import type {
  EmailProviderAdapter,
  OutboundAttachment,
} from "@/modules/mails/lib/types";

import { stampConversationActivity } from "./conversation-activity";
import { replySubject } from "./format";
import {
  assertTransactionalQuota,
  outboundMessageCreateData,
  resolveProviderAdapter,
} from "./outbound";
import { resolveFrom } from "./sender";

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

  await assertTransactionalQuota(
    (message) => new ConversationSendError(message, "QUOTA_EXCEEDED"),
  );

  const adapter =
    input.adapter ??
    (await resolveProviderAdapter(
      (message) => new ConversationSendError(message, "PROVIDER_ERROR"),
    ));

  const account = conversation.emailAccount;
  const from = resolveFrom(account);

  const lastMessage = await db.emailMessage.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    select: { subject: true, messageId: true },
  });

  const subject = input.subject?.trim() || replySubject(lastMessage?.subject);
  const bodyText = htmlToPlainText(input.bodyHtml);

  const result = await adapter.sendOneToOne({
    to: conversation.contactEmail,
    from,
    subject,
    html: input.bodyHtml,
    text: bodyText,
    replyTo: account.email,
    attachments: input.attachments,
  });

  if (!result.success) {
    throw new ConversationSendError(result.error, "PROVIDER_ERROR");
  }

  const messageId = await db.$transaction(async (transaction) => {
    const message = await transaction.emailMessage.create({
      data: outboundMessageCreateData({
        conversationId: conversation.id,
        subject,
        bodyHtml: input.bodyHtml,
        bodyText,
        fromAddress: from,
        toAddresses: [conversation.contactEmail],
        externalId: result.externalId,
        inReplyTo: lastMessage?.messageId ?? null,
        attachments: input.attachments,
        sentAt: new Date(),
      }),
    });

    await stampConversationActivity(transaction, {
      conversationId: conversation.id,
      at: message.sentAt ?? message.createdAt,
    });

    return message.id;
  });

  return {
    conversationId: conversation.id,
    messageId,
    providerId: result.externalId,
  };
}
