import "server-only";

import type { AutomationEffect } from "@/modules/automations/lib/effects";
import type { JsonObject, JsonValue } from "@/modules/automations/lib/graph";
import { db } from "@/shared/lib/db";

function asObject(value: JsonValue | undefined): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function readString(source: JsonObject, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

const LIST_UNSUBSCRIBE_HEADER = "List-Unsubscribe";
const LIST_UNSUBSCRIBE_POST_HEADER = "List-Unsubscribe-Post";
const LIST_UNSUBSCRIBE_POST_VALUE = "List-Unsubscribe=One-Click";

function normalizeAppUrl(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\/+$/, "");
  return normalized ? normalized : undefined;
}

/**
 * Builds the RFC 8058 one-click unsubscribe headers pointing at this app's
 * public endpoint (the app is the single source of truth for consent). Returns
 * `undefined` when `NEXT_PUBLIC_APP_URL` is not configured, so the send still
 * goes out and the template footer keeps working.
 */
function buildUnsubscribeHeaders(
  contactId: string,
): Record<string, string> | undefined {
  const appUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (!appUrl) {
    return undefined;
  }

  const url = `${appUrl}/api/newsletter/unsubscribe/?id=${contactId}`;

  return {
    [LIST_UNSUBSCRIBE_HEADER]: `<${url}>`,
    [LIST_UNSUBSCRIBE_POST_HEADER]: LIST_UNSUBSCRIBE_POST_VALUE,
  };
}

/**
 * Sequence delivery policy owned by the contacts domain.
 *
 * Decorates the generic `mail` effect at the runtime's single composition point
 * (`createAutomationRuntimeEffects`), so the Send Email node and
 * `sendAutomationEmail` stay Contact-free (ADR-0008). It reads the
 * already-interpolated recipient from the effect request, resolves it to an
 * `EmailContact`, and suppresses the send when consent was revoked
 * (`isSubscriber = false`): the inner effect is never called, so no email is
 * delivered and no `EmailSendLog` row is written, and the Step is not marked as
 * failed. When the Contact exists and the app URL is configured, it forwards
 * the request with the one-click unsubscribe headers merged into the config;
 * otherwise the request is passed to the inner effect unchanged.
 */
export function createSequenceDeliveryPolicy(
  inner: AutomationEffect,
): AutomationEffect {
  return async (request) => {
    const record = asObject(request);
    const config = asObject(record.config);
    const recipient = readString(config, "recipient");

    if (!recipient) {
      return inner(request);
    }

    const contact = await db.emailContact.findUnique({
      where: { email: recipient },
      select: { id: true, isSubscriber: true },
    });

    if (!contact) {
      return inner(request);
    }

    if (!contact.isSubscriber) {
      return { sent: false, skipped: true };
    }

    const headers = buildUnsubscribeHeaders(contact.id);

    if (!headers) {
      return inner(request);
    }

    return inner({
      ...record,
      config: {
        ...config,
        headers: { ...asObject(config.headers), ...headers },
      },
    });
  };
}
