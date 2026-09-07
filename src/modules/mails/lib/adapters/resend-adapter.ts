import { Resend } from "resend";
import {
  BatchSyncResult,
  CreateContactResult,
  DeleteContactResult,
  EmailProviderAdapter,
  SyncResult,
} from "../types";

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
        errors.push(`Impossible to list contact segments: ${listError.message}`);
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
    idempotencyKey: _idempotencyKey,
  }: {
    segmentExternalId: string;
    subject: string;
    html: string;
    from: string;
    replyTo?: string;
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
}
