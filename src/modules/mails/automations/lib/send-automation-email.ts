import "server-only";

import { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { sendEmail } from "../../lib/mail";
import type { GenericEmail } from "../../lib/types";
import { AUTOMATION_EMAIL_LOG_TYPE } from "../constants";

/**
 * Default delivery: the real mail pipeline, told not to write its own
 * `EmailSendLog` row so this function can own the single, idempotent audit
 * record.
 */
const deliverEmail = (email: GenericEmail) => sendEmail(email, { log: false });

/** Transient vs permanent failure raised while sending an automation email. */
export class AutomationEmailError extends Error {
  constructor(
    message: string,
    public readonly transient = false,
  ) {
    super(message);
    this.name = "AutomationEmailError";
  }
}

export interface SendAutomationEmailInput {
  to: string;
  subject: string;
  body: string;
  /** Overrides the configured sender. Defaults to the mail settings sender. */
  from?: string;
  replyTo?: string;
  /** Transport headers forwarded verbatim to the provider. */
  headers?: Record<string, string>;
  /** When present, a repeated send with the same key is skipped. */
  idempotencyKey?: string;
  /**
   * Delivery seam. Defaults to the real mail pipeline; tests inject an
   * in-memory recorder so no network call is made.
   */
  transport?: (email: GenericEmail) => Promise<boolean>;
}

export interface SendAutomationEmailResult {
  to: string;
  from: string;
  subject: string;
  /** True when a provider accepted the message on this call. */
  sent: boolean;
  /** True when the send was suppressed because the key was already logged. */
  skipped: boolean;
}

function resolveSender(
  settings: {
    emailSender?: string | null;
    emailSenderName?: string | null;
  },
): string | null {
  if (!settings.emailSender) {
    return null;
  }

  return settings.emailSenderName
    ? `${settings.emailSenderName} <${settings.emailSender}>`
    : settings.emailSender;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isTransientTransportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return [
    "timeout",
    "timed out",
    "rate limit",
    "rate_limit",
    "too many requests",
    "temporary",
    "network",
    "econnrefused",
    "econnreset",
    "etimedout",
    "unavailable",
    "service unavailable",
    "internal server error",
    "internal_server_error",
    // Bare HTTP statuses commonly returned by provider SDKs.
    "429",
    "500",
    "502",
    "503",
    "504",
  ].some((marker) => normalized.includes(marker));
}

/**
 * Send a single transactional email on behalf of an automation Step,
 * idempotently per `idempotencyKey` (typically `automation:{runId}:{stepId}`).
 *
 * The message is delivered through the existing mail pipeline (`sendEmail`,
 * provider adapters, `EmailSetting`) and audited in `EmailSendLog`. The audit
 * row is written *before* delivery to claim the key: a retried Step (or a
 * crashed worker) finds the row and skips, so a Step never sends twice. If
 * delivery fails, the reservation is released so the retry can attempt again.
 */
export async function sendAutomationEmail(
  input: SendAutomationEmailInput,
): Promise<SendAutomationEmailResult> {
  const to = input.to?.trim();
  const subject = input.subject?.trim();
  const body = input.body ?? "";

  if (!to || !subject) {
    throw new AutomationEmailError(
      "Send Email requires a recipient and a subject",
      false,
    );
  }

  if (!body) {
    throw new AutomationEmailError("Send Email requires a body", false);
  }

  const settings = await db.emailSetting.findFirst();

  if (!settings || !settings.emailProvider) {
    throw new AutomationEmailError(
      "Email provider is not configured",
      false,
    );
  }

  const from = input.from?.trim() || resolveSender(settings);

  if (!from) {
    throw new AutomationEmailError("Email sender is not configured", false);
  }

  const replyTo = input.replyTo?.trim() || settings.emailResponse || undefined;

  const idempotencyKey = input.idempotencyKey;

  if (idempotencyKey) {
    const existing = await db.emailSendLog.findUnique({
      where: { idempotencyKey },
      select: { id: true, to: true, from: true, subject: true },
    });

    if (existing) {
      return {
        to: existing.to,
        from: existing.from,
        subject: existing.subject ?? subject,
        sent: false,
        skipped: true,
      };
    }

    try {
      // Claim the key before delivering: a crash between here and the provider
      // call leaves the reservation in place, so a retry skips rather than
      // sending twice.
      await db.emailSendLog.create({
        data: {
          to,
          from,
          subject,
          type: AUTOMATION_EMAIL_LOG_TYPE,
          idempotencyKey,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        // A concurrent attempt already claimed the key: it owns the send.
        return { to, from, subject, sent: false, skipped: true };
      }
      throw error;
    }
  }

  const email: GenericEmail = {
    to,
    from,
    subject,
    html: body,
    type: AUTOMATION_EMAIL_LOG_TYPE,
    replyTo,
    headers: input.headers,
    idempotencyKey,
  };

  const transport = input.transport ?? deliverEmail;

  try {
    const delivered = await transport(email);

    if (!delivered) {
      throw new AutomationEmailError(
        "The email provider did not accept the message",
        false,
      );
    }
  } catch (error) {
    if (idempotencyKey) {
      // Release the claim so a retry (transient) can attempt the send again.
      await db.emailSendLog.deleteMany({ where: { idempotencyKey } });
    }

    if (error instanceof AutomationEmailError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unknown email send error";

    throw new AutomationEmailError(message, isTransientTransportError(error));
  }

  return { to, from, subject, sent: true, skipped: false };
}
