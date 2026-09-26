export {
  AUTOMATION_EMAIL_LOG_TYPE,
  SEND_EMAIL_NODE_TYPE,
} from "./constants";
export { sendEmailNodeCatalogEntry } from "./catalog";
export { sendEmailHandler, sendEmailNodeRegistry } from "./node";
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
