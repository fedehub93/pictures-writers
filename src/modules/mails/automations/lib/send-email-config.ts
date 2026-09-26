import {
  interpolateAutomationValue,
  type AutomationInterpolationContext,
} from "@/modules/automations/lib/interpolate";
import type { JsonObject } from "@/modules/automations/lib/graph";

export interface SendEmailConfig {
  recipient: string;
  subject: string;
  body: string;
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
  const body = asTrimmedString(interpolated.body);

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

  if (!body) {
    throw new MissingSendEmailConfigError(
      "Send Email node is missing a body",
    );
  }

  const from = asTrimmedString(interpolated.from);
  const replyTo = asTrimmedString(interpolated.replyTo);

  return {
    recipient,
    subject,
    body,
    ...(from ? { from } : {}),
    ...(replyTo ? { replyTo } : {}),
  };
}
