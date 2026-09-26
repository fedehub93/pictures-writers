import "server-only";

import type { JsonObject, JsonValue } from "@/modules/automations/lib/graph";
import type { AutomationEffect } from "@/modules/automations/lib/effects";
import { AutomationNodeError } from "@/modules/automations/lib/node-registry";

import type { GenericEmail } from "../../lib/types";
import {
  AutomationEmailError,
  sendAutomationEmail,
} from "./send-automation-email";

/** Builds the stable per-Step idempotency key used to dedupe email sends. */
export function automationEmailIdempotencyKey(
  runId: string,
  stepId: string,
): string {
  return `automation:${runId}:${stepId}`;
}

function readString(source: JsonObject, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

export interface CreateAutomationMailEffectOptions {
  /** Test seam forwarded to the sender; defaults to the real mail pipeline. */
  transport?: (email: GenericEmail) => Promise<boolean>;
}

/**
 * The real `mail` effect: maps a Send Email node request onto the existing mail
 * pipeline, idempotent per `(runId, stepId)` and audited in `EmailSendLog`.
 */
export function createAutomationMailEffect(
  options: CreateAutomationMailEffectOptions = {},
): AutomationEffect {
  return async (request): Promise<JsonValue> => {
    const record =
      request && typeof request === "object" && !Array.isArray(request)
        ? (request as JsonObject)
        : {};
    const config =
      record.config &&
      typeof record.config === "object" &&
      !Array.isArray(record.config)
        ? (record.config as JsonObject)
        : {};

    const runId = readString(record, "runId");
    const stepId = readString(record, "stepId");

    try {
      const result = await sendAutomationEmail({
        to: readString(config, "recipient") ?? "",
        subject: readString(config, "subject") ?? "",
        body: readString(config, "body") ?? "",
        from: readString(config, "from"),
        replyTo: readString(config, "replyTo"),
        idempotencyKey:
          runId && stepId
            ? automationEmailIdempotencyKey(runId, stepId)
            : undefined,
        transport: options.transport,
      });

      return {
        to: result.to,
        from: result.from,
        subject: result.subject,
        sent: result.sent,
        skipped: result.skipped,
      };
    } catch (error) {
      if (error instanceof AutomationEmailError) {
        throw new AutomationNodeError(error.message, error.transient);
      }

      throw error;
    }
  };
}
