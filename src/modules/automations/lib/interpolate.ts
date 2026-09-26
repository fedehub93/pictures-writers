import type { JsonObject, JsonValue } from "./graph";

export type AutomationInterpolationContext = {
  input: JsonValue;
  payload: JsonValue;
  run: { id: string; triggerType: string };
  step: { id: string; attempts: number };
};

const TEMPLATE_PATTERN = /\{\{\s*(.*?)\s*\}\}/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readPath(value: JsonValue, path: string): JsonValue {
  if (!path) {
    return value;
  }

  return path.split(".").reduce<JsonValue>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    return (current as JsonObject)[key] ?? null;
  }, value);
}

function resolveExpression(
  expression: string,
  context: AutomationInterpolationContext,
): JsonValue {
  const trimmed = expression.trim();
  const [head, ...rest] = trimmed.split(".");
  const path = rest.join(".");

  switch (head) {
    case "input":
      return readPath(context.input, path);
    case "payload":
      return readPath(context.payload, path);
    case "run":
      return readPath(context.run as unknown as JsonValue, path);
    case "step":
      return readPath(context.step as unknown as JsonValue, path);
    default:
      return null;
  }
}

/**
 * Replaces `{{ ... }}` expressions inside a JSON value with values from the
 * execution context. When an entire string is a single expression, the raw
 * resolved value is returned (so numbers/booleans/objects stay typed); mixed
 * strings are interpolated as text, with `null`/`undefined` becoming `""`.
 */
export function interpolateAutomationValue(
  value: JsonValue,
  context: AutomationInterpolationContext,
): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const matches = Array.from(value.matchAll(TEMPLATE_PATTERN));

    if (matches.length === 0) {
      return value;
    }

    if (matches.length === 1 && matches[0][0] === value) {
      return resolveExpression(matches[0][1], context);
    }

    return value.replace(TEMPLATE_PATTERN, (_, expression: string) => {
      const resolved = resolveExpression(expression, context);
      return resolved === null || resolved === undefined ? "" : String(resolved);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolateAutomationValue(item, context));
  }

  if (isRecord(value)) {
    const result: JsonObject = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = interpolateAutomationValue(item as JsonValue, context);
    }
    return result;
  }

  return value;
}
