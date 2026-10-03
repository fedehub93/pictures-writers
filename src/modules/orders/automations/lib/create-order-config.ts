import type { JsonObject } from "@/modules/automations/lib/graph";
import {
  interpolateAutomationValue,
  type AutomationInterpolationContext,
} from "@/modules/automations/lib/interpolate";

export interface CreateOrderItemConfig {
  productId: string;
  quantity: number;
}

export interface CreateOrderConfig {
  customerId: string;
  items: CreateOrderItemConfig[];
  notes?: string;
}

export class MissingCreateOrderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingCreateOrderConfigError";
  }
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toQuantity(value: unknown): number | undefined {
  const quantity =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(quantity) && quantity >= 1 ? quantity : undefined;
}

function readItems(value: unknown): CreateOrderItemConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CreateOrderItemConfig[] = [];

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      continue;
    }

    const productId = asTrimmedString((entry as JsonObject).productId);
    const quantity = toQuantity((entry as JsonObject).quantity);

    if (productId && quantity) {
      items.push({ productId, quantity });
    }
  }

  return items;
}

/**
 * Interpolates a `CREATE_ORDER` node's configuration against the run context.
 * `customerId` usually resolves from the predecessor `CREATE_CUSTOMER` output
 * (`{{ input.customerId }}`); product ids and quantities may also be templated.
 */
export function resolveCreateOrderConfig(
  data: JsonObject,
  context: AutomationInterpolationContext,
): CreateOrderConfig {
  const interpolated = interpolateAutomationValue(data, context) as JsonObject;

  const customerId = asTrimmedString(interpolated.customerId);
  if (!customerId) {
    throw new MissingCreateOrderConfigError(
      "Create Order node is missing a customer",
    );
  }

  const items = readItems(interpolated.items);
  if (items.length === 0) {
    throw new MissingCreateOrderConfigError(
      "Create Order node requires at least one product",
    );
  }

  const notes = asTrimmedString(interpolated.notes);

  return {
    customerId,
    items,
    ...(notes ? { notes } : {}),
  };
}
