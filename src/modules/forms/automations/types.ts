import type { JsonObject } from "@/modules/automations/lib/graph";

/**
 * Shape of the `form.submitted` Run payload. Shared by the trigger's default
 * palette data and the emitter so the two cannot drift.
 */
export type FormSubmittedPayload = {
  formId: string;
  email: string;
  /**
   * Id of the `EmailContact` the submission belongs to, when the emitter knows
   * it. Optional: `form.submitted` is a forms event and does not presuppose a
   * Contact, so a contact-less emit simply omits the key.
   */
  contactId?: string;
  /** The submitted answers. */
  data: JsonObject;
  submittedAt: string;
};
