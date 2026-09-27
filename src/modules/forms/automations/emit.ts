import "server-only";

import { enqueueEventRuns } from "@/modules/automations/lib/automation-events";
import type { JsonObject } from "@/modules/automations/lib/graph";

import { FORM_SUBMITTED_TRIGGER_TYPE } from "./constants";
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
  const now = input.now ?? new Date();
  const submittedAt = input.submittedAt ?? now;

  const payload: FormSubmittedPayload = {
    formId: input.formId,
    email: input.email,
    data: input.data,
    submittedAt: submittedAt.toISOString(),
  };

  return enqueueEventRuns({
    triggerType: FORM_SUBMITTED_TRIGGER_TYPE,
    payload,
    idempotencyKey: input.contactId ?? input.email,
    now,
  });
}
