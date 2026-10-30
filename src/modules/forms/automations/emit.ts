import "server-only";

import { enqueueEventRuns } from "@/modules/automations/lib/automation-events";
import type { JsonObject } from "@/modules/automations/lib/graph";
import { normalizeEmail } from "@/shared/lib/email";

import { FORM_SUBMITTED_TRIGGER_TYPE } from "./constants";
import { readConfiguredFormId } from "./lib/form-submitted-config";
import type { FormSubmittedPayload } from "./types";

export interface FormSubmittedEventInput {
  /** Id of the submitted form. */
  formId: string;
  /** The responder's email address. */
  email: string;
  /**
   * Id of the `EmailContact` the submission belongs to, forwarded in the
   * payload when known. It is no longer the dedup key: the canonical address
   * is, so two rows for the same person cannot start two Runs (ADR-0005).
   */
  contactId?: string | null;
  /** The submitted answers; forwarded to the Run payload untouched. */
  data: JsonObject;
  submittedAt?: Date;
  now?: Date;
}

/**
 * Entry point for the internal `form.submitted` event. Called by the forms
 * module's submission actions; it hands a domain-shaped payload and the
 * canonical address as idempotency key to the domain-agnostic engine.
 */
export async function emitFormSubmitted(
  input: FormSubmittedEventInput,
): Promise<{ runIds: string[] }> {
  // The trigger is always scoped to one form; an unscoped event would fan out
  // to legacy triggers with no form configured, so it is a no-op.
  if (!input.formId) {
    return { runIds: [] };
  }

  // The address is the identity used as key: without one there is nothing to
  // deduplicate, and no Contact to target either.
  const email = normalizeEmail(input.email);

  if (!email) {
    return { runIds: [] };
  }

  const now = input.now ?? new Date();
  const submittedAt = input.submittedAt ?? now;

  const payload: FormSubmittedPayload = {
    formId: input.formId,
    email,
    // Surfaced only when known, so a contact-less emit leaves the key absent
    // rather than shipping a null the Run payload would carry forever.
    ...(input.contactId ? { contactId: input.contactId } : {}),
    data: input.data,
    submittedAt: submittedAt.toISOString(),
  };

  return enqueueEventRuns({
    triggerType: FORM_SUBMITTED_TRIGGER_TYPE,
    payload,
    // The canonical address, not the Contact id: it stays stable even if two
    // rows for the same person reappear (race, future path bypassing the
    // helper), so the double Run stays impossible (ADR-0005).
    idempotencyKey: email,
    now,
    // Only Automations whose trigger is scoped to this exact form react; the
    // filter is the forms module's, the engine just asks the predicate.
    matchesNode: (node) => readConfiguredFormId(node.data) === input.formId,
  });
}
