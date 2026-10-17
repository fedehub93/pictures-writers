import "server-only";

import { db } from "@/shared/lib/db";
import type {
  EmailInboundAdapter,
  InboundWebhookData,
} from "@/modules/mails/lib/types";

import type { AttachmentStorage } from "./attachment-storage";

export type InboundHandlingResult =
  | { status: "processed"; conversationId: string; messageId: string }
  | { status: "discarded"; reason: "unknown-account" };

export interface HandleInboundEmailDeps {
  adapter: EmailInboundAdapter;
  storage: AttachmentStorage;
}

/** Lowercase, trim and drop empty/duplicate addresses. */
function normalizeAddresses(addresses: string[]): string[] {
  const seen = new Set<string>();
  for (const address of addresses) {
    const normalized = address.trim().toLowerCase();
    if (normalized) seen.add(normalized);
  }
  return [...seen];
}

/** Parse `"Name" <email>` or a bare address into its parts. */
function parseEmailAddress(raw: string): { email: string; name?: string } {
  const bracketed = raw.match(/<([^>]+)>/);
  if (bracketed) {
    const name = raw
      .slice(0, raw.indexOf("<"))
      .trim()
      .replace(/^"|"$/g, "")
      .trim();
    return { email: bracketed[1].trim().toLowerCase(), name: name || undefined };
  }
  return { email: raw.trim().toLowerCase(), name: undefined };
}

/**
 * Persist an inbound email: match it to an active `EmailAccount`, copy its
 * attachments into application storage, and record the Conversation,
 * EmailMessage and EmailAttachments. Returns `discarded` when no account owns
 * any of the recipient addresses.
 */
export async function handleInboundEmail(
  event: InboundWebhookData,
  deps: HandleInboundEmailDeps,
): Promise<InboundHandlingResult> {
  const recipients = normalizeAddresses([
    ...(event.to ?? []),
    ...(event.received_for ?? []),
  ]);

  if (recipients.length === 0) {
    return { status: "discarded", reason: "unknown-account" };
  }

  const account = await db.emailAccount.findFirst({
    where: {
      isActive: true,
      email: { in: recipients, mode: "insensitive" },
    },
  });

  if (!account) {
    return { status: "discarded", reason: "unknown-account" };
  }

  const inbound = await deps.adapter.fetchInbound(event.email_id);

  // Idempotency: webhook providers retry, so an already-recorded provider id
  // short-circuits without creating a duplicate message.
  const alreadyRecorded = await db.emailMessage.findFirst({
    where: { externalId: inbound.externalId },
  });
  if (alreadyRecorded) {
    return {
      status: "processed",
      conversationId: alreadyRecorded.conversationId,
      messageId: alreadyRecorded.id,
    };
  }

  // Copy each attachment from the provider's expiring URL into our storage.
  const storedAttachments = [];
  for (const attachment of inbound.attachments) {
    const { url } = await deps.adapter.getAttachmentDownloadUrl(
      inbound.externalId,
      attachment.externalId,
    );
    const stored = await deps.storage.store({
      filename: attachment.filename,
      contentType: attachment.contentType,
      sourceUrl: url,
    });
    storedAttachments.push({
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size ?? null,
      url: stored.url,
      externalId: attachment.externalId,
    });
  }

  const sender = parseEmailAddress(inbound.from);
  const contactEmail = sender.email;

  const existingConversation = await db.conversation.findFirst({
    where: {
      emailAccountId: account.id,
      contactEmail: { equals: contactEmail, mode: "insensitive" },
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  const conversation =
    existingConversation ??
    (await db.conversation.create({
      data: {
        emailAccountId: account.id,
        contactEmail,
        contactName: sender.name ?? null,
      },
    }));

  const message = await db.emailMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      status: "RECEIVED",
      subject: inbound.subject ?? event.subject ?? null,
      bodyHtml: inbound.bodyHtml ?? null,
      bodyText: inbound.bodyText ?? null,
      fromAddress: inbound.from,
      toAddresses: inbound.to,
      ccAddresses: inbound.cc,
      bccAddresses: inbound.bcc,
      messageId: inbound.messageId ?? event.message_id ?? null,
      inReplyTo: inbound.inReplyTo ?? null,
      references: inbound.references,
      externalId: inbound.externalId,
      sentAt: inbound.receivedAt,
      attachments: storedAttachments.length
        ? { create: storedAttachments }
        : undefined,
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      hasUnread: true,
      // Backfill the display name when the thread is reused and the first
      // message had none.
      ...(existingConversation && !existingConversation.contactName && sender.name
        ? { contactName: sender.name }
        : {}),
    },
  });

  return {
    status: "processed",
    conversationId: conversation.id,
    messageId: message.id,
  };
}
