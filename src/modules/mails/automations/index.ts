export {
  AUTOMATION_EMAIL_LOG_TYPE,
  SEND_EMAIL_NODE_TYPE,
  SUBSCRIPTION_CONFIRMED_NODE_TYPE,
  SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE,
} from "./constants";
export {
  sendEmailNodeCatalogEntry,
  subscriptionConfirmedTriggerCatalogEntry,
  subscriptionConfirmedTriggerDefaultData,
} from "./catalog";
export {
  sendEmailHandler,
  sendEmailNodeRegistry,
  subscriptionConfirmedNodeRegistry,
} from "./node";
export type { SubscriptionConfirmedPayload } from "./types";
export {
  MissingSendEmailConfigError,
  resolveSendEmailConfig,
} from "./lib/send-email-config";
export type { SendEmailConfig } from "./lib/send-email-config";
export {
  createAutomationMailEffect,
  automationEmailIdempotencyKey,
} from "./lib/mail-effect";
export type { CreateAutomationMailEffectOptions } from "./lib/mail-effect";
export {
  AutomationEmailError,
  sendAutomationEmail,
} from "./lib/send-automation-email";
export type {
  SendAutomationEmailInput,
  SendAutomationEmailResult,
} from "./lib/send-automation-email";
