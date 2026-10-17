import { Resend } from "resend";
import {
  BatchSyncResult,
  CreateContactResult,
  DeleteContactResult,
  EmailProviderAdapter,
  InboundAttachmentMetadata,
  InboundEmail,
  SendOneToOneParams,
  SendOneToOneResult,
  SyncResult,
  VerifiedWebhookEvent,
  WebhookSignatureHeaders,
} from "../types";

/** Read a header case-insensitively from a `Record<string, string>`. */
function readHeader(
  headers: Record<string, string> | null | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

/** Split a `References`/`In-Reply-To` header into individual message ids. */
function parseMessageIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Map the provider's attachment shape to the inbound metadata contract. */
function toAttachmentMetadata(attachment: {
  id: string;
  filename?: string | null;
  content_type: string;
  size: number;
}): InboundAttachmentMetadata {
  return {
    externalId: attachment.id,
    filename: attachment.filename ?? "attachment",
    contentType: attachment.content_type,
    size: attachment.size ?? undefined,
  };
}

// Helper utility per mettere in pausa l'esecuzione
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ResendAdapter implements EmailProviderAdapter {
  private resendClient: Resend;

  constructor() {
    if (!process.env.NEXT_RESEND_KEY) {
      throw new Error("NEXT_RESEND_KEY is missing in environment variables");
    }
    this.resendClient = new Resend(process.env.NEXT_RESEND_KEY);
  }

  async syncSegment(
    externalId: string | null,
    name: string,
  ): Promise<SyncResult> {
    const errors: string[] = [];

    let currentSegmentId = externalId;
    let newExternalId: string | undefined = undefined;

    if (externalId) {
      const existingSegment = await this.resendClient.segments.get(externalId);
      currentSegmentId = existingSegment.data?.id ?? null;
    }
    if (!currentSegmentId) {
      try {
        const { data, error } = await this.resendClient.segments.create({
          name: name,
        });
        if (error || !data) {
          throw new Error(
            error?.message || "Unknown error during audience sync process",
          );
        }

        newExternalId = data.id;
      } catch (e: any) {
        return {
          errors: [`Impossible to sync the audience: ${e.message}`],
        };
      }
    }

    return { errors, newExternalId };
  }

  async deleteSegment(externalId: string): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    try {
      const { error } = await this.resendClient.segments.remove(externalId);
      if (error) {
        throw new Error(
          error.message || "Unknown error during segment deletion",
        );
      }
    } catch (e: any) {
      return {
        errors: [`Impossible to delete the segment: ${e.message}`],
      };
    }

    return { errors };
  }

  async syncContactsBatch(
    contacts: {
      email: string;
      id: string;
      firstName?: string;
      lastName?: string;
      isSubscriber?: boolean;
      audiences?: { externalId: string }[];
    }[],
  ): Promise<BatchSyncResult> {
    const result: BatchSyncResult = {
      success: false,
      totalProcessed: contacts.length,
      successfulCount: 0,
      failedCount: 0,
      errors: [],
      syncedContacts: [],
    };

    if (contacts.length === 0) {
      result.success = true;
      return result;
    }

    // Resend rate limit: 10 requests/second/team (Sept 2026).
    // Each contact = 1 API call (contacts.create).
    // CHUNK_SIZE = 8 with 1050ms delay ≈ 7.6 req/s — safe margin below 10.
    const CHUNK_SIZE = 8;
    const RATE_LIMIT_DELAY_MS = 1050;
    const MAX_RETRIES = 3;
    const BASE_RETRY_DELAY_MS = 2000;

    for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
      const chunk = contacts.slice(i, i + CHUNK_SIZE);

      const promises = chunk.map(async (contact) => {
        // Retry wrapper for rate-limit (429) errors
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const createResponse = await this.resendClient.contacts.create({
            email: contact.email,
            firstName: contact.firstName || undefined,
            lastName: contact.lastName || undefined,
            unsubscribed: !contact.isSubscriber,
            segments: contact.audiences
              ? contact.audiences.map((a) => ({ id: a.externalId }))
              : undefined,
            properties: {
              external_id: contact.id,
            },
          });

          if (createResponse.error) {
            const isRateLimit =
              createResponse.error.statusCode === 429 ||
              createResponse.error.name === "rate_limit_exceeded";

            if (isRateLimit && attempt < MAX_RETRIES) {
              // Use retry-after header if available, else exponential backoff
              const retryAfterHeader = createResponse.headers?.["retry-after"];
              const retryDelay = retryAfterHeader
                ? parseInt(retryAfterHeader, 10) * 1000
                : BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
              await sleep(retryDelay);
              continue;
            }

            return { error: createResponse.error };
          }

          const contactId = createResponse.data?.id;
          if (!contactId) {
            return {
              error: {
                message: "Contact ID not returned by Resend",
                statusCode: null,
                name: "application_error" as const,
              },
            };
          }

          return { data: createResponse.data, localId: contact.id };
        }
        // Should not reach here, but TypeScript needs it
        return {
          error: {
            message: "Max retries exceeded for rate limit",
            statusCode: 429,
            name: "rate_limit_exceeded" as const,
          },
        };
      });

      const settledResults = await Promise.allSettled(promises);

      for (const [index, promiseResult] of settledResults.entries()) {
        const originalContact = chunk[index];

        if (promiseResult.status === "fulfilled") {
          const resendResponse = promiseResult.value;

          if (resendResponse.error) {
            result.failedCount++;
            result.errors.push({
              email: originalContact.email,
              reason: resendResponse.error.message,
            });
          } else {
            result.successfulCount++;
            if (resendResponse.data?.id) {
              result.syncedContacts.push({
                localId: resendResponse.localId,
                externalId: resendResponse.data.id,
              });
            }
          }
        } else {
          result.failedCount++;
          result.errors.push({
            email: originalContact.email,
            reason: promiseResult.reason?.message || "Critical network error",
          });
        }
      }

      // Pause between chunks to respect rate limit
      if (i + CHUNK_SIZE < contacts.length) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    }

    // 5. Determiniamo il successo globale dell'operazione
    result.success = result.failedCount === 0;

    return result;
  }

  /**
   * Add contacts to a segment (delta import). Per contact:
   *  - `externalId` present → the contact already exists on the provider,
   *    so we only add the segment membership via the dedicated endpoint
   *    (idempotent, no body, no documented error for existing members).
   *  - `externalId` absent → the contact does not exist on the provider yet,
   *    so we create it with the segment already attached and return the new
   *    `externalId` in `syncedContacts` so the local DB can persist it.
   *
   * Network concerns (chunking, pause between chunks, retry with backoff on
   * 429) mirror `syncContactsBatch`. Per-contact errors are aggregated without
   * aborting the rest of the batch.
   */
  async addContactsToSegment(
    contacts: {
      email: string;
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      isSubscriber?: boolean;
      externalId?: string | null;
    }[],
    segmentExternalId: string,
  ): Promise<BatchSyncResult> {
    const result: BatchSyncResult = {
      success: false,
      totalProcessed: contacts.length,
      successfulCount: 0,
      failedCount: 0,
      errors: [],
      syncedContacts: [],
    };

    if (contacts.length === 0) {
      result.success = true;
      return result;
    }

    // Resend rate limit: 10 requests/second/team (Sept 2026).
    // Each contact = 1 API call (segments.add or contacts.create).
    // CHUNK_SIZE = 8 with 1050ms delay ≈ 7.6 req/s — safe margin below 10.
    const CHUNK_SIZE = 8;
    const RATE_LIMIT_DELAY_MS = 1050;
    const MAX_RETRIES = 3;
    const BASE_RETRY_DELAY_MS = 2000;

    for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
      const chunk = contacts.slice(i, i + CHUNK_SIZE);

      const promises = chunk.map(async (contact) => {
        // Retry wrapper for rate-limit (429) errors
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const alreadyExists = !!contact.externalId;

          const response = alreadyExists
            ? await this.resendClient.contacts.segments.add({
                email: contact.email,
                segmentId: segmentExternalId,
              })
            : await this.resendClient.contacts.create({
                email: contact.email,
                firstName: contact.firstName || undefined,
                lastName: contact.lastName || undefined,
                unsubscribed: !contact.isSubscriber,
                segments: [{ id: segmentExternalId }],
                properties: {
                  external_id: contact.id,
                },
              });

          if (response.error) {
            const isRateLimit =
              response.error.statusCode === 429 ||
              response.error.name === "rate_limit_exceeded";

            if (isRateLimit && attempt < MAX_RETRIES) {
              // Use retry-after header if available, else exponential backoff
              const retryAfterHeader = response.headers?.["retry-after"];
              const retryDelay = retryAfterHeader
                ? parseInt(retryAfterHeader, 10) * 1000
                : BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
              await sleep(retryDelay);
              continue;
            }

            return { error: response.error, created: false };
          }

          if (alreadyExists) {
            // Membership add — nothing new to persist locally
            return { data: null, localId: contact.id, created: false };
          }

          const contactId = response.data?.id;
          if (!contactId) {
            return {
              error: {
                message: "Contact ID not returned by Resend",
                statusCode: null,
                name: "application_error" as const,
              },
              created: false,
            };
          }

          return { data: response.data, localId: contact.id, created: true };
        }
        // Should not reach here, but TypeScript needs it
        return {
          error: {
            message: "Max retries exceeded for rate limit",
            statusCode: 429,
            name: "rate_limit_exceeded" as const,
          },
          created: false,
        };
      });

      const settledResults = await Promise.allSettled(promises);

      for (const [index, promiseResult] of settledResults.entries()) {
        const originalContact = chunk[index];

        if (promiseResult.status === "fulfilled") {
          const res = promiseResult.value;

          if (res.error) {
            result.failedCount++;
            result.errors.push({
              email: originalContact.email,
              reason: res.error.message,
            });
          } else {
            result.successfulCount++;
            if (res.created && res.data?.id) {
              result.syncedContacts.push({
                localId: res.localId,
                externalId: res.data.id,
              });
            }
          }
        } else {
          result.failedCount++;
          result.errors.push({
            email: originalContact.email,
            reason: promiseResult.reason?.message || "Critical network error",
          });
        }
      }

      // Pause between chunks to respect rate limit
      if (i + CHUNK_SIZE < contacts.length) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    }

    result.success = result.failedCount === 0;

    return result;
  }

  async createContact(
    email: string,
    externalId: string,
    firstName?: string | null,
    lastName?: string | null,
    isSubscriber?: boolean,
    segments?: { externalId: string }[],
  ): Promise<CreateContactResult> {
    const errors: string[] = [];

    try {
      const { data, error } = await this.resendClient.contacts.create({
        email: email,
        properties: {
          external_id: externalId,
        },
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        unsubscribed: !isSubscriber,
        segments: segments
          ? [...segments].map((a) => ({ id: a.externalId }))
          : undefined,
      });

      if (error || !data) {
        throw new Error(
          error?.message || "Unknown error during contact creation",
        );
      }

      const newExternalId = data.id;

      return { errors, newExternalId };
    } catch (e: any) {
      return {
        errors: [`Impossible to create the contact: ${e.message}`],
      };
    }
  }

  async upsertContact(
    email: string,
    id: string,
    firstName?: string | null,
    lastName?: string | null,
    isSubscriber?: boolean,
    audiences?: { externalId: string | null }[],
  ): Promise<{ errors: string[]; externalId: string }> {
    const errors: string[] = [];

    try {
      // Step 1: Try to get existing contact by email
      const getResponse = await this.resendClient.contacts.get({ email });

      if (getResponse.data?.id) {
        // Contact exists — update it
        const filteredAudiences = (audiences ?? [])
          .filter((a): a is { externalId: string } => !!a.externalId)
          .map((a) => ({ id: a.externalId }));

        const updateResponse = await this.resendClient.contacts.update({
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          unsubscribed: !isSubscriber,
          properties: {
            external_id: id,
          },
        });

        if (updateResponse.error) {
          throw new Error(
            updateResponse.error.message ||
              "Unknown error during contact update",
          );
        }

        // Segment memberships are NOT part of contacts.update — they are
        // managed via contacts.segments.*. Reconcile the membership so the
        // provider matches the local audience associations.
        await this.reconcileContactSegments(email, filteredAudiences, errors);

        return { errors, externalId: getResponse.data.id };
      }

      // Contact does not exist — create it
      const filteredAudiences = (audiences ?? [])
        .filter((a): a is { externalId: string } => !!a.externalId)
        .map((a) => ({ id: a.externalId }));

      const createResponse = await this.resendClient.contacts.create({
        email,
        properties: {
          external_id: id,
        },
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        unsubscribed: !isSubscriber,
        ...(filteredAudiences.length > 0
          ? { segments: filteredAudiences }
          : {}),
      });

      if (createResponse.error || !createResponse.data) {
        throw new Error(
          createResponse.error?.message ||
            "Unknown error during contact creation",
        );
      }

      return { errors, externalId: createResponse.data.id };
    } catch (e: any) {
      return {
        errors: [`Impossible to upsert the contact: ${e.message}`],
        externalId: "",
      };
    }
  }

  /**
   * Reconcile a contact's segment memberships on the provider with the
   * desired set. `contacts.update` does NOT accept `segments`, so
   * memberships are managed via `contacts.segments.*`:
   *  - list current memberships,
   *  - add missing ones,
   *  - remove stale ones.
   * Errors are pushed into `errors` (the caller surfaces them) without
   * aborting the remaining reconciliations.
   */
  private async reconcileContactSegments(
    email: string,
    desiredSegments: { id: string }[],
    errors: string[],
  ): Promise<void> {
    const desiredIds = new Set(desiredSegments.map((s) => s.id));

    try {
      const { data: listData, error: listError } =
        await this.resendClient.contacts.segments.list({ email, limit: 100 });

      if (listError) {
        errors.push(
          `Impossible to list contact segments: ${listError.message}`,
        );
        return;
      }

      const currentIds = new Set((listData?.data ?? []).map((s) => s.id));

      for (const id of desiredIds) {
        if (!currentIds.has(id)) {
          const { error } = await this.resendClient.contacts.segments.add({
            email,
            segmentId: id,
          });
          if (error) {
            errors.push(`Impossible to add segment ${id}: ${error.message}`);
          }
        }
      }

      for (const id of currentIds) {
        if (!desiredIds.has(id)) {
          const { error } = await this.resendClient.contacts.segments.remove({
            email,
            segmentId: id,
          });
          if (error) {
            errors.push(`Impossible to remove segment ${id}: ${error.message}`);
          }
        }
      }
    } catch (e: unknown) {
      errors.push(
        `Impossible to reconcile contact segments: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  async deleteContact(email: string): Promise<DeleteContactResult> {
    const errors: string[] = [];

    try {
      const { data, error } = await this.resendClient.contacts.remove({
        email,
      });

      if (error || !data) {
        throw new Error(
          error?.message || "Unknown error during contact deletion",
        );
      }
    } catch (e: any) {
      return {
        errors: [`Impossible to delete the contact: ${e.message}`],
      };
    }

    return { errors };
  }

  async sendBulk({
    segmentExternalId,
    subject,
    html,
    from,
    replyTo,
    previewText,
    idempotencyKey: _idempotencyKey,
  }: {
    segmentExternalId: string;
    subject: string;
    html: string;
    from: string;
    replyTo?: string;
    previewText?: string;
    idempotencyKey?: string;
  }) {
    try {
      // Chiamata all'endpoint Broadcast di Resend vedi documentazione 2026
      // Nota: idempotencyKey non è ancora supportato da broadcasts.create nel SDK Resend
      // (solo emails.send e batch lo supportano). Lo scartiamo per ora.
      const { data, error } = await this.resendClient.broadcasts.create({
        name: subject,
        segmentId: segmentExternalId,
        from: from,
        subject: subject,
        html: html,
        send: true,
        replyTo: replyTo ? [replyTo] : undefined,
        previewText: previewText || undefined,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        externalCampaignId: data?.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Unknown error during Resend broadcast creation",
      };
    }
  }

  // ─── Outbound one-to-one ─────────────────────────────────────────────────────

  /**
   * Send a single transactional email via `emails.send`. Attachments are
   * passed as URL-based `path` entries so the provider downloads them from our
   * storage instead of receiving an inline payload.
   */
  async sendOneToOne({
    to,
    from,
    subject,
    html,
    text,
    replyTo,
    attachments,
  }: SendOneToOneParams): Promise<SendOneToOneResult> {
    try {
      const { data, error } = await this.resendClient.emails.send({
        to: [to],
        from,
        subject,
        html,
        text,
        replyTo: replyTo ? [replyTo] : undefined,
        attachments: attachments?.length
          ? attachments.map((attachment) => ({
              filename: attachment.filename,
              contentType: attachment.contentType,
              path: attachment.url,
            }))
          : undefined,
      });

      if (error || !data) {
        return {
          success: false,
          error: error?.message || "Unknown error during one-to-one send",
        };
      }

      return { success: true, externalId: data.id };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Unknown error during one-to-one send",
      };
    }
  }

  // ─── Inbound (receiving) ───────────────────────────────────────────────────

  /**
   * Verify the Svix signature on an inbound webhook and decode the event.
   * Throws when the signature is invalid or the payload is malformed.
   */
  verifyWebhook({
    payload,
    headers,
    webhookSecret,
  }: {
    payload: string;
    headers: WebhookSignatureHeaders;
    webhookSecret: string;
  }): VerifiedWebhookEvent {
    const event = this.resendClient.webhooks.verify({
      payload,
      headers,
      webhookSecret,
    }) as VerifiedWebhookEvent;

    return event;
  }

  /**
   * Fetch the full body of a received email plus its attachment metadata.
   * The body lives behind a separate endpoint (GET /inbounds/{id}) so the
   * webhook payload stays small.
   */
  async fetchInbound(externalId: string): Promise<InboundEmail> {
    const { data, error } = await this.resendClient.emails.receiving.get(
      externalId,
    );

    if (error || !data) {
      throw new Error(
        error?.message || `Impossible to fetch inbound email ${externalId}`,
      );
    }

    const inReplyTo = readHeader(data.headers, "in-reply-to");
    const references = parseMessageIds(readHeader(data.headers, "references"));

    return {
      externalId: data.id,
      messageId: data.message_id,
      inReplyTo,
      references,
      from: data.from,
      to: data.to ?? [],
      cc: data.cc ?? [],
      bcc: data.bcc ?? [],
      subject: data.subject,
      bodyHtml: data.html ?? undefined,
      bodyText: data.text ?? undefined,
      receivedAt: new Date(data.created_at),
      attachments: (data.attachments ?? []).map(toAttachmentMetadata),
    };
  }

  /** List the attachments (metadata only) of a received email. */
  async listInboundAttachments(
    externalId: string,
  ): Promise<InboundAttachmentMetadata[]> {
    const { data, error } =
      await this.resendClient.emails.receiving.attachments.list({
        emailId: externalId,
      });

    if (error) {
      throw new Error(
        error.message || `Impossible to list attachments for ${externalId}`,
      );
    }

    return (data?.data ?? []).map(toAttachmentMetadata);
  }

  /** Resolve a short-lived signed download URL for a single attachment. */
  async getAttachmentDownloadUrl(
    emailExternalId: string,
    attachmentExternalId: string,
  ): Promise<{ url: string; expiresAt?: Date }> {
    const { data, error } =
      await this.resendClient.emails.receiving.attachments.get({
        emailId: emailExternalId,
        id: attachmentExternalId,
      });

    if (error || !data) {
      throw new Error(
        error?.message ||
          `Impossible to resolve attachment ${attachmentExternalId}`,
      );
    }

    return {
      url: data.download_url,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    };
  }
}
