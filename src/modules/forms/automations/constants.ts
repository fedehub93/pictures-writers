/**
 * UI node type of the internal `form.submitted` trigger. The forms module owns
 * it; the engine recognises it by the `*_TRIGGER` naming convention and
 * canonicalises it to `form_submitted`.
 */
export const FORM_SUBMITTED_NODE_TYPE = "FORM_SUBMITTED_TRIGGER";

/// Canonical trigger event name persisted on the Run (`AutomationRun.triggerType`).
export const FORM_SUBMITTED_TRIGGER_TYPE = "form.submitted";
