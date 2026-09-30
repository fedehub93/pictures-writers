import type { AutomationNode, JsonObject, JsonValue } from "../graph";
import {
  interpolateAutomationValue,
  type AutomationInterpolationContext,
} from "../interpolate";

/**
 * Raised by action config resolvers when a node is missing required
 * configuration. The registry converts it to a permanent
 * `AutomationNodeError` so the step fails with a clear message.
 */
export class MissingActionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingActionConfigError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Interpolates a node's configuration against the run context, then narrows it
 * to an object. Every config string supports `{{ ... }}` expressions resolved
 * from the incoming token, the trigger payload and the run/step metadata.
 */
export function resolveActionConfig(
  data: JsonObject,
  context: AutomationInterpolationContext,
): JsonObject {
  const interpolated = interpolateAutomationValue(data, context);
  return isRecord(interpolated) ? (interpolated as JsonObject) : {};
}

export function readTrimmedString(
  source: JsonObject,
  key: string,
): string | undefined {
  const value = source[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readNumber(
  source: JsonObject,
  key: string,
): number | undefined {
  const value = source[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

/**
 * Resolves the Credential a node references. The id may live on the Node row
 * (top-level `credentialId`) or inside its `data` payload (the shape the editor
 * stores it in). It is only the id: the secret is resolved at the server
 * execution boundary, never in node configuration or snapshots.
 */
export function resolveCredentialId(
  node: AutomationNode,
  config: JsonObject,
): string | undefined {
  const fromNode =
    typeof node.credentialId === "string" ? node.credentialId.trim() : "";
  if (fromNode) {
    return fromNode;
  }

  return readTrimmedString(config, "credentialId");
}

export interface ActionEffectRequestInput {
  /** A resolved action config; plain and serialisable by construction. */
  config: object;
  credentialId?: string;
  context: AutomationInterpolationContext;
}

/**
 * Shapes the request passed to an action effect. The effect is the provider
 * seam: tests inject in-memory recorders, the runtime wires real providers.
 */
export function buildActionEffectRequest({
  config,
  credentialId,
  context,
}: ActionEffectRequestInput): JsonValue {
  return {
    config: config as JsonObject,
    credentialId: credentialId ?? null,
    input: context.input ?? null,
    payload: context.payload ?? null,
    run: { id: context.run.id, triggerType: context.run.triggerType },
    step: { id: context.step.id, attempts: context.step.attempts },
  } as JsonValue;
}
