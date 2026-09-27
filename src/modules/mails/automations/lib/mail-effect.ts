import "server-only";

import type { JsonObject, JsonValue } from "@/modules/automations/lib/graph";
import type { AutomationEffect } from "@/modules/automations/lib/effects";
import {
  interpolateAutomationValue,
  type AutomationInterpolationContext,
} from "@/modules/automations/lib/interpolate";
import { AutomationNodeError } from "@/modules/automations/lib/node-registry";
import { db } from "@/shared/lib/db";

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

function readObject(source: JsonObject, key: string): JsonObject {
  const value = source[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

/**
 * Resolves the message HTML: the inline `body` by default, or the referenced
 * `EmailTemplate`'s `bodyHtml` interpolated against the run context when an
 * `emailTemplateId` is configured.
 */
async function resolveEmailBody(
  config: JsonObject,
  context: AutomationInterpolationContext,
): Promise<string> {
  const emailTemplateId = readString(config, "emailTemplateId");

  if (!emailTemplateId) {
    return readString(config, "body") ?? "";
  }

  const template = await db.emailTemplate.findUnique({
    where: { id: emailTemplateId },
    select: { bodyHtml: true },
  });

  if (!template) {
    throw new AutomationNodeError("Email template not found", false);
  }

  const bodyHtml = template.bodyHtml?.trim();

  if (!bodyHtml) {
    throw new AutomationNodeError("Email template has no body", false);
  }

  const interpolated = interpolateAutomationValue(bodyHtml, context);

  return typeof interpolated === "string"
    ? interpolated
    : interpolated === null || interpolated === undefined
      ? ""
      : String(interpolated);
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

    const run = readObject(record, "run");
    const step = readObject(record, "step");
    const runId = readString(run, "id");
    const stepId = readString(step, "id");

    const interpolation: AutomationInterpolationContext = {
      input: record.input ?? null,
      payload: record.payload ?? null,
      run: {
        id: runId ?? "",
        triggerType: readString(run, "triggerType") ?? "",
      },
      step: {
        id: stepId ?? "",
        attempts: typeof step.attempts === "number" ? step.attempts : 0,
      },
    };

    try {
      const body = await resolveEmailBody(config, interpolation);

      const result = await sendAutomationEmail({
        to: readString(config, "recipient") ?? "",
        subject: readString(config, "subject") ?? "",
        body,
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
