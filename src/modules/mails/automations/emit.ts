import "server-only";

import { enqueueEventRuns } from "@/modules/automations/lib/automation-events";

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
 * time; it hands a domain-shaped payload and the contact-based idempotency key
 * to the domain-agnostic engine. No scoping, so no `matchesNode`.
 */
export async function emitSubscriptionConfirmed(
  input: SubscriptionConfirmedEventInput,
): Promise<{ runIds: string[] }> {
  const payload: SubscriptionConfirmedPayload = {
    email: input.email,
    contactId: input.contactId,
    confirmedAt: input.confirmedAt.toISOString(),
  };

  return enqueueEventRuns({
    triggerType: SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE,
    payload,
    // The contact id is the dedup key (ADR-0005); the email is a defensive
    // fallback, mirroring `emitFormSubmitted`.
    idempotencyKey: input.contactId ?? input.email,
  });
}
