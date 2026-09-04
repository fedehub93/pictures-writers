import "server-only";

import type { ScheduledAction } from "@/generated/prisma";
import {
  sendSingleSend,
  EmailSendError,
} from "@/modules/mails/single-sends/lib/send-single-send";

import { ScheduledActionHandlerError } from "../../constants";

export interface SendEmailContext {
  now?: Date;
}

/**
 * Handler for SEND_EMAIL scheduled actions.
 *
 * Reads the latest subject, body, and audience configuration from the
 * EmailSingleSend at execution time. Contacts are resolved dynamically by the
 * provider segment and are never copied into the scheduled action.
 */
export async function handleSendEmail(
  action: ScheduledAction,
  _context: SendEmailContext = {},
): Promise<{ providerId: string }> {
  if (action.targetType !== "EMAIL_SINGLE_SEND") {
    throw new ScheduledActionHandlerError(
      `Unexpected target type ${action.targetType}`,
      false,
    );
  }

  try {
    const result = await sendSingleSend({
      singleSendId: action.targetId,
      idempotencyKey: action.idempotencyKey,
    });

    return { providerId: result.providerId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email send error";

    const transient = error instanceof EmailSendError && error.transient;

    throw new ScheduledActionHandlerError(message, transient);
  }
}
