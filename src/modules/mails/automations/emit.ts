import "server-only";

import { enqueueEventRuns } from "@/modules/automations/lib/automation-events";
import { normalizeEmail } from "@/shared/lib/email";

import { SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE } from "./constants";
import type { SubscriptionConfirmedPayload } from "./types";

export interface SubscriptionConfirmedEventInput {
  /** Email address that was just confirmed. */
  email: string;
  /** Id of the `EmailContact` that was confirmed. */
  contactId: string;
  /** When the address was confirmed. */
  confirmedAt: Date;
}

/**
 * Entry point for the internal `subscription.confirmed` event. Called by the
 * confirmation action once a contact's address has been verified for the first
 * time; it hands a domain-shaped payload and the canonical address as
 * idempotency key to the domain-agnostic engine. No scoping, so no
 * `matchesNode`.
 */
export async function emitSubscriptionConfirmed(
  input: SubscriptionConfirmedEventInput,
): Promise<{ runIds: string[] }> {
  const email = normalizeEmail(input.email);

  if (!email) {
    return { runIds: [] };
  }

  const payload: SubscriptionConfirmedPayload = {
    email,
    contactId: input.contactId,
    confirmedAt: input.confirmedAt.toISOString(),
  };

  return enqueueEventRuns({
    triggerType: SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE,
    payload,
    // Canonical address as key, mirroring `emitFormSubmitted` (ADR-0005).
    idempotencyKey: email,
  });
}
