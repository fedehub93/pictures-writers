import type { JsonObject } from "@/modules/automations/lib/graph";

/**
 * Shape of the `form.submitted` Run payload. Shared by the trigger's default
 * palette data and the emitter so the two cannot drift.
 */
export type FormSubmittedPayload = {
  formId: string;
  email: string;
  /** The submitted answers. */
  data: JsonObject;
  submittedAt: string;
};
