// lib/mail/types.ts

export type GenericEmail = {
  to: string;
  from: string;
  subject: string;
  type: string;
  replyTo?: string;
  text?: string;
  html?: string;
  /// Extra transport headers forwarded verbatim to the provider. A transport
  /// concern (e.g. `List-Unsubscribe`), not a domain one.
  headers?: Record<string, string>;
  /// Opaque idempotency key persisted on the EmailSendLog row. Reusing the
  /// same key never sends twice.
  idempotencyKey?: string;
};

export interface SyncResult {
  errors: string[];
  newExternalId?: string; // Aggiunto per restituire il nuovo ID al DB locale
}

export type SyncErrorDetail = {
  email: string;
  reason: string;
};

export type BatchSyncResult = {
  success: boolean; // true se TUTTI i contatti sono stati sincronizzati senza errori
  totalProcessed: number; // Quanti contatti hai tentato di inviare
  successfulCount: number; // Quanti sono andati a buon fine
  failedCount: number; // Quanti hanno generato un errore
  errors: SyncErrorDetail[]; // Dettaglio degli errori per il log o per la UI
  syncedContacts: { localId: string; externalId: string }[];
};

export type CreateContactResult = {
  errors: string[];
  newExternalId?: string;
};

// ─── Inbound email (provider → application) ──────────────────────────────────

/** Attachment metadata as reported by the provider. No signed URL yet. */
export type InboundAttachmentMetadata = {
  externalId: string;
  filename: string;
  contentType: string;
  size?: number;
};

/** A fully fetched inbound email body plus its attachment metadata. */
export type InboundEmail = {
  externalId: string;
  messageId?: string;
  inReplyTo?: string;
  references: string[];
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  receivedAt: Date;
  attachments: InboundAttachmentMetadata[];
};

/** Raw `email.received` payload embedded in a provider webhook event. */
export type InboundWebhookData = {
  email_id: string;
  message_id: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  received_for: string[];
  subject: string;
  created_at: string;
};

/** Headers used to verify a provider webhook signature. */
export type WebhookSignatureHeaders = {
  id: string;
  timestamp: string;
  signature: string;
};

/** Result of verifying a provider webhook signature. */
export type VerifiedWebhookEvent =
  | { type: "email.received"; data: InboundWebhookData }
  | { type: string; data: unknown };

/**
 * Narrow a verified webhook event to an inbound email. Needed because the
 * generic variant's `type` is a plain `string`, which the compiler cannot
 * exclude by discrimination alone.
 */
export function isReceivedEmailEvent(
  event: VerifiedWebhookEvent,
): event is { type: "email.received"; data: InboundWebhookData } {
  return event.type === "email.received";
}

/**
 * Provider contract for receiving email. Implemented by adapters that can
 * receive inbound messages (currently Resend).
 */
export interface EmailInboundAdapter {
  /**
   * Verify a webhook signature and decode the event. Must throw when the
   * signature is invalid.
   */
  verifyWebhook(params: {
    payload: string;
    headers: WebhookSignatureHeaders;
    webhookSecret: string;
  }): VerifiedWebhookEvent;

  /** Fetch the full body and attachment metadata of a received email. */
  fetchInbound(externalId: string): Promise<InboundEmail>;

  /** List attachment metadata for a received email. */
  listInboundAttachments(
    externalId: string,
  ): Promise<InboundAttachmentMetadata[]>;

  /** Resolve a short-lived download URL for a single attachment. */
  getAttachmentDownloadUrl(
    emailExternalId: string,
    attachmentExternalId: string,
  ): Promise<{ url: string; expiresAt?: Date }>;
}

export type DeleteContactResult = {
  errors: string[];
};

export interface EmailProviderAdapter extends EmailInboundAdapter {
  syncSegment(externalId: string | null, name: string): Promise<SyncResult>;
  syncContactsBatch(
    contacts: {
      email: string;
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      isSubscriber?: boolean;
      audiences?: { externalId: string | null }[];
    }[],
  ): Promise<BatchSyncResult>;
  addContactsToSegment(
    contacts: {
      email: string;
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      isSubscriber?: boolean;
      externalId?: string | null;
    }[],
    segmentExternalId: string,
  ): Promise<BatchSyncResult>;
  createContact(
    email: string,
    id: string,
    firstName?: string | null,
    lastName?: string | null,
    isSubscriber?: boolean,
    audiences?: { externalId: string | null }[],
  ): Promise<CreateContactResult>;
  deleteContact(email: string): Promise<DeleteContactResult>;
  upsertContact(
    email: string,
    id: string,
    firstName?: string | null,
    lastName?: string | null,
    isSubscriber?: boolean,
    audiences?: { externalId: string | null }[],
  ): Promise<{ errors: string[]; externalId: string }>;
  deleteSegment(externalId: string): Promise<{ errors: string[] }>;
  sendBulk(params: {
    segmentExternalId: string;
    subject: string;
    html: string;
    from: string;
    replyTo?: string;
    previewText?: string;
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    externalCampaignId?: string;
    error?: string;
  }>;
}
