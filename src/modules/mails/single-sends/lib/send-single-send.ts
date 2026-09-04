import "server-only";

import Handlebars from "handlebars";

import { db } from "@/shared/lib/db";
import type { EmailProviderAdapter } from "@/modules/mails/lib/types";
import { getProviderAdapter } from "@/modules/mails/lib/core";

export class EmailSendError extends Error {
  constructor(
    message: string,
    public readonly transient: boolean,
  ) {
    super(message);
  }
}

export interface SendSingleSendInput {
  singleSendId: string;
  idempotencyKey?: string;
  /** Injected adapter for testing. */
  adapter?: EmailProviderAdapter;
  /** Optional override for the sender (defaults to settings). */
  from?: string;
  replyTo?: string;
}

export interface SendSingleSendResult {
  providerId: string;
}

function classifyProviderError(errorMessage: string): boolean {
  const transientMarkers = [
    "timeout",
    "rate limit",
    "too many requests",
    "temporary",
    "network",
    "econnrefused",
    "unavailable",
    "internal server error",
  ];

  const normalized = errorMessage.toLowerCase();
  return transientMarkers.some((marker) => normalized.includes(marker));
}

/**
 * Send a single email newsletter using the latest saved subject, body, and
 * audience configuration. Contacts are resolved at execution time through the
 * provider segment; they are never copied into the scheduled action.
 *
 * Multiple audiences are handled explicitly: one provider broadcast is created
 * per audience and the resulting identifiers are joined into a single value.
 */
export async function sendSingleSend({
  singleSendId,
  idempotencyKey,
  adapter,
  from,
  replyTo,
}: SendSingleSendInput): Promise<SendSingleSendResult> {
  const singleSend = await db.emailSingleSend.findUnique({
    where: { id: singleSendId },
    include: { audiences: true },
  });

  if (!singleSend) {
    throw new EmailSendError("Single send not found", false);
  }

  if (!singleSend.subject || !singleSend.bodyHtml) {
    throw new EmailSendError(
      "Single send is missing subject or body",
      false,
    );
  }

  const audiences = singleSend.audiences;

  if (audiences.length === 0) {
    throw new EmailSendError("No audience selected", false);
  }

  const syncedAudiences = audiences.filter((a) => !!a.externalId);

  if (syncedAudiences.length === 0) {
    throw new EmailSendError(
      "Selected audiences are not synchronized with the provider",
      false,
    );
  }

  if (syncedAudiences.length !== audiences.length) {
    throw new EmailSendError(
      "Some selected audiences are not synchronized with the provider",
      false,
    );
  }

  let effectiveFrom = from;
  let effectiveReplyTo = replyTo;
  let effectiveAdapter = adapter;

  if (!effectiveFrom || !effectiveAdapter) {
    const settings = await db.emailSetting.findFirst();

    if (!settings || !settings.emailSender) {
      throw new EmailSendError(
        "Missing or incomplete email settings",
        false,
      );
    }

    if (!settings.emailProvider) {
      throw new EmailSendError(
        "Email provider is not configured",
        false,
      );
    }

    effectiveFrom ??= settings.emailSenderName
      ? `${settings.emailSenderName} <${settings.emailSender}>`
      : settings.emailSender;

    effectiveReplyTo ??= settings.emailResponse ?? undefined;

    effectiveAdapter ??= getProviderAdapter(settings.emailProvider);
  }

  const template = Handlebars.compile(singleSend.bodyHtml);
  const html = template({});

  const providerIds: string[] = [];

  for (const audience of syncedAudiences) {
    const result = await effectiveAdapter.sendBulk({
      segmentExternalId: audience.externalId!,
      subject: singleSend.subject,
      html,
      from: effectiveFrom,
      replyTo: effectiveReplyTo,
      idempotencyKey,
    });

    if (!result.success) {
      const transient = classifyProviderError(result.error ?? "Provider error");
      throw new EmailSendError(
        result.error || "Provider send failed",
        transient,
      );
    }

    if (result.externalCampaignId) {
      providerIds.push(result.externalCampaignId);
    }
  }

  return {
    providerId: providerIds.join(","),
  };
}
