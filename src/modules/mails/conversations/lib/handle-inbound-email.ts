import "server-only";

import { db } from "@/shared/lib/db";
import type {
  EmailInboundAdapter,
  InboundAttachmentMetadata,
  InboundWebhookData,
} from "@/modules/mails/lib/types";

import type { AttachmentStorage } from "./attachment-storage";

const ATTACHMENT_DOWNLOAD_ATTEMPTS = 3;
const ATTACHMENT_RETRY_DELAYS_MS = [0, 250, 1000];
const RETRYABLE_DOWNLOAD_STATUSES = new Set([
  403, 404, 408, 425, 429, 500, 502, 503, 504,
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Host and signature presence, safe to log without leaking signed params. */
function downloadUrlDiagnostics(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return {
      host: url.host,
      signed:
        url.searchParams.has("Key-Pair-Id") ||
        url.searchParams.has("Signature") ||
        url.searchParams.has("signature") ||
        url.searchParams.has("X-Amz-Signature"),
    };
  } catch {
    return { host: "<invalid>", signed: false };
  }
}

type DownloadFailure = {
  error?: Error;
  status?: number;
  url?: string;
  expiresAt?: Date;
};

/**
 * Download an attachment from the provider. Signed URLs are short-lived, so
 * every attempt re-resolves a fresh URL before fetching; 403/404/5xx are
 * treated as retryable because the CDN can lag behind the webhook delivery.
 */
async function downloadAttachment(params: {
  adapter: EmailInboundAdapter;
  emailExternalId: string;
  attachment: InboundAttachmentMetadata;
}): Promise<Uint8Array<ArrayBuffer>> {
  const { adapter, emailExternalId, attachment } = params;
  const failure: DownloadFailure = {};

  for (let attempt = 0; attempt < ATTACHMENT_DOWNLOAD_ATTEMPTS; attempt++) {
    const delay = ATTACHMENT_RETRY_DELAYS_MS[attempt] ?? 1000;
    if (delay > 0) await sleep(delay);

    try {
      const { url, expiresAt } = await adapter.getAttachmentDownloadUrl(
        emailExternalId,
        attachment.externalId,
      );
      failure.url = url;
      failure.expiresAt = expiresAt;

      const response = await fetch(url, {
        cache: "no-store",
        redirect: "follow",
        headers: { "user-agent": "pictures-writers/1.0" },
      });

      if (response.ok) {
        return new Uint8Array(await response.arrayBuffer());
      }

      failure.status = response.status;
      failure.error = new Error(
        `Attachment download failed with status ${response.status}`,
      );

      if (!RETRYABLE_DOWNLOAD_STATUSES.has(response.status)) break;
    } catch (error) {
      failure.status = undefined;
      failure.error =
        error instanceof Error ? error : new Error(String(error));
    }
  }

  const { host, signed } = failure.url
    ? downloadUrlDiagnostics(failure.url)
    : { host: "<none>", signed: false };

  console.error("[RESEND_INBOUND_WEBHOOK] attachment download failed", {
    attachmentId: attachment.externalId,
    status: failure.status,
    host,
    signed,
    expiresAt: failure.expiresAt?.toISOString(),
  });

  throw failure.error ?? new Error("Attachment download failed");
}

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
    const content = await downloadAttachment({
      adapter: deps.adapter,
      emailExternalId: inbound.externalId,
      attachment,
    });
    const stored = await deps.storage.store({
      filename: attachment.filename,
      contentType: attachment.contentType,
      content,
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
