import type { JsonObject } from "@/modules/automations/lib/graph";
import {
  interpolateAutomationValue,
  type AutomationInterpolationContext,
} from "@/modules/automations/lib/interpolate";

export interface CreateCustomerConfig {
  email: string;
  name?: string;
  phone?: string;
  notes?: string;
}

export class MissingCreateCustomerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingCreateCustomerConfigError";
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
 * Interpolates a `CREATE_CUSTOMER` node's configuration against the run
 * context. `{{ ... }}` expressions resolve from the incoming token, the trigger
 * payload and the run/step metadata, so the email/name usually come from a form
 * submission. Email is required; the rest are optional.
 */
export function resolveCreateCustomerConfig(
  data: JsonObject,
  context: AutomationInterpolationContext,
): CreateCustomerConfig {
  const interpolated = interpolateAutomationValue(
    data,
    context,
  ) as JsonObject;

  const email = asTrimmedString(interpolated.email);

  if (!email) {
    throw new MissingCreateCustomerConfigError(
      "Create Customer node is missing an email",
    );
  }

  const name = asTrimmedString(interpolated.name);
  const phone = asTrimmedString(interpolated.phone);
  const notes = asTrimmedString(interpolated.notes);

  return {
    email,
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(notes ? { notes } : {}),
  };
}
