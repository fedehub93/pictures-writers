import "server-only";

import { enqueueEventRuns } from "@/modules/automations/lib/automation-events";
import type { JsonObject } from "@/modules/automations/lib/graph";

import { FORM_SUBMITTED_TRIGGER_TYPE } from "./constants";
import { readConfiguredFormId } from "./lib/form-submitted-config";
import type { FormSubmittedPayload } from "./types";

export interface FormSubmittedEventInput {
  /** Id of the submitted form. */
  formId: string;
  /** The responder's email address. */
  email: string;
  /**
   * Id of the `EmailContact` the submission belongs to. The forms module uses
   * it as the engine's opaque idempotency key, so a second submission from the
   * same contact while the first Run is non-terminal does not start a second
   * nurture cycle (ADR-0005). Falls back to the email when absent.
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
 * contact-based idempotency key to the domain-agnostic engine.
 */
export async function emitFormSubmitted(
  input: FormSubmittedEventInput,
): Promise<{ runIds: string[] }> {
  // The trigger is always scoped to one form; an unscoped event would fan out
  // to legacy triggers with no form configured, so it is a no-op.
  if (!input.formId) {
    return { runIds: [] };
  }

  const now = input.now ?? new Date();
  const submittedAt = input.submittedAt ?? now;

  const payload: FormSubmittedPayload = {
    formId: input.formId,
    email: input.email,
    // Surfaced only when known, so a contact-less emit leaves the key absent
    // rather than shipping a null the Run payload would carry forever.
    ...(input.contactId ? { contactId: input.contactId } : {}),
    data: input.data,
    submittedAt: submittedAt.toISOString(),
  };

  return enqueueEventRuns({
    triggerType: FORM_SUBMITTED_TRIGGER_TYPE,
    payload,
    idempotencyKey: input.contactId ?? input.email,
    now,
    // Only Automations whose trigger is scoped to this exact form react; the
    // filter is the forms module's, the engine just asks the predicate.
    matchesNode: (node) => readConfiguredFormId(node.data) === input.formId,
  });
}
