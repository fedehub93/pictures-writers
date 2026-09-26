import {
  canonicalNodeType,
  toJsonValue,
  type AutomationNode,
  type JsonObject,
  type JsonValue,
} from "./graph";
import { passthroughEffects, type AutomationEffects } from "./effects";
import {
  interpolateAutomationValue,
  readPath,
  type AutomationInterpolationContext,
} from "./interpolate";

export type AutomationNodeHandlerContext = {
  node: AutomationNode;
  input: JsonValue;
  payload: JsonValue;
  run: {
    id: string;
    triggerType: string;
  };
  step: {
    id: string;
    attempts: number;
  };
  now: Date;
  effects: AutomationEffects;
};

export type AutomationNodeHandlerResult = {
  output?: JsonValue;
  outputPort?: string;
  resumeAt?: Date;
};

export type AutomationNodeHandler = (
  context: AutomationNodeHandlerContext,
) =>
  | void
  | AutomationNodeHandlerResult
  | Promise<void | AutomationNodeHandlerResult>;

export type AutomationNodeRegistry = Record<string, AutomationNodeHandler>;

export class AutomationNodeError extends Error {
  constructor(
    message: string,
    public readonly transient = false,
  ) {
    super(message);
    this.name = "AutomationNodeError";
  }
}

export class TransientAutomationNodeError extends AutomationNodeError {
  constructor(message: string) {
    super(message, true);
    this.name = "TransientAutomationNodeError";
  }
}

export function isTransientNodeError(error: unknown): boolean {
  if (
    error instanceof AutomationNodeError ||
    (error && typeof error === "object" && "transient" in error)
  ) {
    return Boolean(
      (error as { transient?: unknown }).transient,
    );
  }

  if (error && typeof error === "object" && "retryable" in error) {
    return Boolean((error as { retryable?: unknown }).retryable);
  }

  return false;
}

function parseDuration(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(
    /^(-?\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|seconds?|m|minutes?|h|hours?|d|days?|w|weeks?)$/i,
  );
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    millisecond: 1,
    milliseconds: 1,
    s: 1000,
    second: 1000,
    seconds: 1000,
    m: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    h: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[unit] ?? 1);
}

const OBJECT_DURATION_MULTIPLIERS: Record<string, number> = {
  ms: 1,
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

function parseNumberMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return null;
}

function readObjectDuration(value: unknown): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const total = Object.entries(OBJECT_DURATION_MULTIPLIERS).reduce(
    (sum, [key, multiplier]) => {
      const duration = parseNumberMs(record[key]);
      return duration === null ? sum : sum + duration * multiplier;
    },
    0,
  );

  return total > 0 ? total : null;
}

function resolveWaitAt(data: JsonObject, now: Date): Date {
  const waitData =
    data.wait && typeof data.wait === "object" && !Array.isArray(data.wait)
      ? (data.wait as JsonObject)
      : data;
  const absolute = waitData.resumeAt ?? waitData.until ?? waitData.datetime;

  if (absolute !== undefined && absolute !== null) {
    const date =
      absolute instanceof Date
        ? absolute
        : new Date(typeof absolute === "number" ? absolute : String(absolute));
    if (Number.isNaN(date.getTime())) {
      throw new AutomationNodeError("Wait node has an invalid resume time");
    }
    return date.getTime() > now.getTime() ? date : now;
  }

  const directDelay =
    waitData.delayMs ??
    waitData.durationMs ??
    waitData.milliseconds ??
    waitData.delay ??
    waitData.duration;
  const duration =
    parseDuration(directDelay) ?? readObjectDuration(waitData.duration);

  if (duration === null || duration < 0) {
    throw new AutomationNodeError("Wait node requires a non-negative delay");
  }

  return new Date(now.getTime() + duration);
}

function effectRequest(context: AutomationNodeHandlerContext): JsonObject {
  return {
    config: context.node.data,
    input: context.input,
    payload: context.payload,
    runId: context.run.id,
    stepId: context.step.id,
  };
}

function compareValues(
  actual: JsonValue,
  operator: string,
  expected: JsonValue,
): boolean {
  switch (operator) {
    case "equals":
    case "eq":
    case "==":
      return actual === expected;
    case "notEquals":
    case "neq":
    case "!=":
      return actual !== expected;
    case "contains":
      return typeof actual === "string" && actual.includes(String(expected ?? ""));
    case "exists":
      return actual !== null && actual !== undefined;
    case "truthy":
      return Boolean(actual);
    case "falsy":
      return !actual;
    default:
      throw new AutomationNodeError(`Unsupported conditional operator: ${operator}`);
  }
}

const passthroughHandler: AutomationNodeHandler = ({ input, payload }) => ({
  output: input === null ? payload : input,
});

const waitHandler: AutomationNodeHandler = ({ node, input, now }) => ({
  output: input,
  resumeAt: resolveWaitAt(node.data, now),
});

const conditionalHandler: AutomationNodeHandler = (context) => {
  const { node, input, payload } = context;
  const interpolationContext: AutomationInterpolationContext = {
    input,
    payload,
    run: context.run,
    step: context.step,
  };
  const config = interpolateAutomationValue(
    node.data,
    interpolationContext,
  ) as JsonObject;
  const source = config.source === "payload" ? payload : input;
  const path = typeof config.path === "string" ? config.path : "";
  const actual = readPath(source, path);
  const expected = config.value === undefined ? null : config.value;
  const operator = typeof config.operator === "string" ? config.operator : "equals";
  const matched = compareValues(actual, operator, expected);

  return {
    output: { value: actual, matched },
    outputPort: matched ? "true" : "false",
  };
};

const effectHandler =
  (effect: keyof AutomationEffects): AutomationNodeHandler =>
  async (context) => ({
    output: await context.effects[effect](toJsonValue(effectRequest(context))),
  });

export const defaultNodeRegistry: AutomationNodeRegistry = {
  initial: passthroughHandler,
  manual: passthroughHandler,
  cron: passthroughHandler,
  webhook: passthroughHandler,
  wait: waitHandler,
  end: passthroughHandler,
  conditional: conditionalHandler,
  httpRequest: effectHandler("http"),
  webSearch: effectHandler("webSearch"),
  llm: effectHandler("llm"),
};

export function mergeNodeRegistries(
  ...registries: AutomationNodeRegistry[]
): AutomationNodeRegistry {
  const merged: AutomationNodeRegistry = {};

  for (const registry of registries) {
    for (const [type, handler] of Object.entries(registry)) {
      merged[canonicalNodeType(type)] = handler;
    }
  }

  return merged;
}

export function getNodeHandler(
  type: string,
  registry: AutomationNodeRegistry = defaultNodeRegistry,
): AutomationNodeHandler | undefined {
  return registry[canonicalNodeType(type)] ?? registry[type];
}

export { passthroughEffects };
