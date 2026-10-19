import "server-only";

import { db } from "@/shared/lib/db";
import type {
  EmailProviderAdapter,
  OutboundAttachment,
} from "@/modules/mails/lib/types";

import {
  assertTransactionalQuota,
  outboundMessageCreateData,
  resolveProviderAdapter,
} from "./outbound";
import { resolveFrom } from "./sender";

export type NewMessageErrorCode =
  | "ACCOUNT_NOT_FOUND"
  | "QUOTA_EXCEEDED"
  | "PROVIDER_ERROR";

export class NewMessageError extends Error {
  constructor(
    message: string,
    public readonly code: NewMessageErrorCode,
  ) {
    super(message);
  }
}

export interface SendNewMessageInput {
  emailAccountId: string;
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: OutboundAttachment[];
  /** Injected adapter for testing; resolved from settings otherwise. */
  adapter?: EmailProviderAdapter;
}

export interface SendNewMessageResult {
  conversationId: string;
  messageId: string;
  providerId?: string;
}

/**
 * Send a brand-new one-to-one message to an arbitrary address: enforce the
 * transactional quota, hand the message to the provider, then record (or reuse)
 * the `Conversation` for that account + address and persist the OUTBOUND
 * `EmailMessage`. A matching `EmailContact` is linked when it exists, but one is
 * never auto-created.
 */
export async function sendNewMessage(
  input: SendNewMessageInput,
): Promise<SendNewMessageResult> {
  const account = await db.emailAccount.findUnique({
    where: { id: input.emailAccountId },
  });

  if (!account) {
    throw new NewMessageError("Email account not found", "ACCOUNT_NOT_FOUND");
  }

  await assertTransactionalQuota(
    (message) => new NewMessageError(message, "QUOTA_EXCEEDED"),
  );

  const adapter =
    input.adapter ??
    (await resolveProviderAdapter(
      (message) => new NewMessageError(message, "PROVIDER_ERROR"),
    ));

  const from = resolveFrom(account);
  const recipient = input.to.trim().toLowerCase();

  const result = await adapter.sendOneToOne({
    to: recipient,
    from,
    subject: input.subject,
    html: input.bodyHtml,
    text: input.bodyText,
    replyTo: account.email,
    attachments: input.attachments,
  });

  if (!result.success) {
    throw new NewMessageError(result.error, "PROVIDER_ERROR");
  }

  const { conversationId, messageId } = await db.$transaction(
    async (transaction) => {
      const contact = await transaction.emailContact.findFirst({
        where: { email: { equals: recipient, mode: "insensitive" } },
        select: { id: true, firstName: true, lastName: true },
      });

      // Grouping is by address, so an existing (non-deleted) conversation for
      // this account + recipient is reused rather than fragmented. New activity
      // unarchives it so the sent message lands in the inbox.
      const existing = await transaction.conversation.findFirst({
        where: {
          emailAccountId: account.id,
          contactEmail: { equals: recipient, mode: "insensitive" },
          deletedAt: null,
        },
        orderBy: { updatedAt: "desc" },
      });

      const contactName =
        existing?.contactName ??
        ([contact?.firstName, contact?.lastName].filter(Boolean).join(" ") ||
          null);

      const conversation =
        existing ??
        (await transaction.conversation.create({
          data: {
            emailAccountId: account.id,
            contactEmail: recipient,
            contactName,
            contactId: contact?.id ?? null,
          },
        }));

      const message = await transaction.emailMessage.create({
        data: outboundMessageCreateData({
          conversationId: conversation.id,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText,
          fromAddress: from,
          toAddresses: [recipient],
          externalId: result.externalId,
          attachments: input.attachments,
          sentAt: new Date(),
        }),
      });

      await transaction.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date(), archivedAt: null },
      });

      return { conversationId: conversation.id, messageId: message.id };
    },
  );

  return {
    conversationId,
    messageId,
    providerId: result.externalId,
  };
}
