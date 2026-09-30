import {
  canonicalNodeType,
  type AutomationNode,
  type JsonObject,
  type JsonValue,
} from "./graph";
import { passthroughEffects, type AutomationEffects } from "./effects";
import { parseDuration, readObjectDuration } from "./duration";
import {
  DEFAULT_TIME_ZONE,
  parseTimeOfDay,
  waitResumeAt,
} from "./time-zone";
import {
  interpolateAutomationValue,
  readPath,
  type AutomationInterpolationContext,
} from "./interpolate";
import { resolveHttpRequestConfig } from "./actions/http-request";
import { resolveLlmConfig } from "./actions/llm";
import {
  buildActionEffectRequest,
  MissingActionConfigError,
  resolveCredentialId,
} from "./actions/shared";
import { resolveWebSearchConfig } from "./actions/web-search";

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
  /** Site IANA time zone, used by time-of-day anchored nodes (see Wait). */
  timeZone?: string;
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

function resolveWaitAt(
  data: JsonObject,
  now: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
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

  // An optional time of day anchors the resume to a wall-clock time in the
  // site zone: "2 days at 09:00" resumes two calendar days later at 09:00,
  // rolled forward if that instant has already passed.
  const timeOfDay = parseTimeOfDay(waitData.timeOfDay);
  if (timeOfDay) {
    return waitResumeAt(now, duration, timeOfDay, timeZone);
  }

  return new Date(now.getTime() + duration);
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

export const passthroughHandler: AutomationNodeHandler = ({
  input,
  payload,
}) => ({
  output: input === null ? payload : input,
});

const waitHandler: AutomationNodeHandler = (context) => {
  const { node, input, payload, now } = context;
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

  return {
    output: input,
    resumeAt: resolveWaitAt(config, now, context.timeZone),
  };
};

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

function resolveActionOrThrow<T>(resolve: () => T): T {
  try {
    return resolve();
  } catch (error) {
    if (error instanceof MissingActionConfigError) {
      throw new AutomationNodeError(error.message, false);
    }
    throw error;
  }
}

/**
 * General-purpose effect-backed actions (HTTP Request, Web Search, LLM).
 *
 * The handler is thin: it interpolates the node config against the run context,
 * resolves the Credential id (never the secret), and delegates to the injected
 * effect, so the engine executes any provider generically (ADR-0003/0004).
 */
const actionHandler =
  (
    resolveConfig: (
      data: JsonObject,
      context: AutomationInterpolationContext,
    ) => object,
    effect: keyof AutomationEffects,
  ): AutomationNodeHandler =>
  async (context) => {
    const { node, input, payload } = context;
    const interpolationContext: AutomationInterpolationContext = {
      input,
      payload,
      run: context.run,
      step: context.step,
    };
    const config = resolveActionOrThrow(() =>
      resolveConfig(node.data, interpolationContext),
    );

    const output = await context.effects[effect](
      buildActionEffectRequest({
        config,
        credentialId: resolveCredentialId(node, config as JsonObject),
        context: interpolationContext,
      }),
    );

    return { output };
  };

export const defaultNodeRegistry: AutomationNodeRegistry = {
  initial: passthroughHandler,
  manual: passthroughHandler,
  cron: passthroughHandler,
  webhook: passthroughHandler,
  wait: waitHandler,
  end: passthroughHandler,
  conditional: conditionalHandler,
  httpRequest: actionHandler(resolveHttpRequestConfig, "http"),
  webSearch: actionHandler(resolveWebSearchConfig, "webSearch"),
  llm: actionHandler(resolveLlmConfig, "llm"),
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
