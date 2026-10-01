import {
  interpolateAutomationValue,
  type AutomationInterpolationContext,
} from "@/modules/automations/lib/interpolate";
import type { JsonObject } from "@/modules/automations/lib/graph";

export interface SendEmailConfig {
  recipient: string;
  subject: string;
  /** Inbox preview summary injected as a hidden preheader. */
  previewText?: string;
  /** Inline HTML body. Omitted when `emailTemplateId` supplies the body. */
  body?: string;
  /**
   * When set, the referenced `EmailTemplate` provides the message HTML and the
   * inline `body` (if any) is ignored. The mail effect loads and interpolates
   * the template, since it is the server boundary with database access.
   */
  emailTemplateId?: string;
  from?: string;
  replyTo?: string;
}

export class MissingSendEmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingSendEmailConfigError";
  }
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Interpolates a Send Email node's configuration against the run context and
 * maps it to the shape the mail pipeline expects. Template expressions resolve
 * from the incoming token (`input`), the trigger payload and the run/step
 * metadata, so both the responder's address and the message body can be
 * dynamic.
 */
export function resolveSendEmailConfig(
  data: JsonObject,
  context: AutomationInterpolationContext,
): SendEmailConfig {
  const interpolated = interpolateAutomationValue(
    data,
    context,
  ) as JsonObject;

  const recipient = asTrimmedString(interpolated.recipient);
  const subject = asTrimmedString(interpolated.subject);
  const previewText = asTrimmedString(interpolated.previewText);
  const body = asTrimmedString(interpolated.body);
  const emailTemplateId = asTrimmedString(interpolated.emailTemplateId);

  if (!recipient) {
    throw new MissingSendEmailConfigError(
      "Send Email node is missing a recipient",
    );
  }

  if (!subject) {
    throw new MissingSendEmailConfigError(
      "Send Email node is missing a subject",
    );
  }

  if (!body && !emailTemplateId) {
    throw new MissingSendEmailConfigError(
      "Send Email node is missing a body or an email template",
    );
  }

  const from = asTrimmedString(interpolated.from);
  const replyTo = asTrimmedString(interpolated.replyTo);

  return {
    recipient,
    subject,
    ...(previewText ? { previewText } : {}),
    ...(body ? { body } : {}),
    ...(emailTemplateId ? { emailTemplateId } : {}),
    ...(from ? { from } : {}),
    ...(replyTo ? { replyTo } : {}),
  };
}
