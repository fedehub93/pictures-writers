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
 * failed. In every other case the request is passed through to the inner
 * effect unchanged.
 */
export function createSequenceDeliveryPolicy(
  inner: AutomationEffect,
): AutomationEffect {
  return async (request) => {
    const record = asObject(request);
    const config = asObject(record.config);
    const recipient = readString(config, "recipient");

    if (recipient) {
      const contact = await db.emailContact.findUnique({
        where: { email: recipient },
        select: { isSubscriber: true },
      });

      if (contact && !contact.isSubscriber) {
        return { sent: false, skipped: true };
      }
    }

    return inner(request);
  };
}
