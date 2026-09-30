/// UI node type of the Send Email action. Uppercase to match the editor's
/// existing node type convention; the engine canonicalises it to `sendEmail`.
export const SEND_EMAIL_NODE_TYPE = "SEND_EMAIL";

/// `EmailSendLog.type` recorded for messages sent by an automation Step.
export const AUTOMATION_EMAIL_LOG_TYPE = "automation";

/**
 * UI node type of the internal `subscription.confirmed` trigger. The mails
 * module owns it; the engine recognises it by the `*_TRIGGER` naming
 * convention and canonicalises it to `subscription_confirmed`.
 */
export const SUBSCRIPTION_CONFIRMED_NODE_TYPE =
  "SUBSCRIPTION_CONFIRMED_TRIGGER";

/// Canonical trigger event name persisted on the Run (`AutomationRun.triggerType`).
export const SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE = "subscription.confirmed";
