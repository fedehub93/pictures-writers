import type { Prisma } from "@/generated/prisma";

export type JsonValue = Prisma.JsonValue;
export type JsonObject = { [key: string]: JsonValue };

export type AutomationNode = {
  id: string;
  type: string;
  name?: string | null;
  data: JsonObject;
  /**
   * Id of the Credential the node references, if any. Only the id travels in
   * snapshots; the secret is resolved at the execution boundary.
   */
  credentialId?: string | null;
};

export type AutomationConnection = {
  fromNodeId: string;
  toNodeId: string;
  fromOutput: string;
  toInput: string;
};

export type AutomationGraph = {
  nodes: AutomationNode[];
  connections: AutomationConnection[];
};

const typeAliases: Record<string, string> = {
  initial: "initial",
  manual: "manual",
  manual_trigger: "manual",
  trigger: "manual",
  cron: "cron",
  cron_trigger: "cron",
  webhook: "webhook",
  webhook_trigger: "webhook",
  wait: "wait",
  end: "end",
  conditional: "conditional",
  http_request: "httpRequest",
  httpRequest: "httpRequest",
  web_search: "webSearch",
  webSearch: "webSearch",
  llm: "llm",
};

const TRIGGER_SUFFIX = "_trigger";

/**
 * Canonicalises a node type or trigger event name to the engine's internal
 * form. Normalisation is generic (camelCase, dots, dashes and spaces all
 * collapse to `_`), and UI trigger types follow a `*_TRIGGER` convention whose
 * suffix the trigger event name omits — e.g. `FORM_SUBMITTED_TRIGGER` and the
 * event `form.submitted` both canonicalise to `form_submitted`. That lets a
 * module register a trigger without the engine knowing the domain.
 */
export function canonicalNodeType(type: string): string {
  const normalized = type
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[.\s-]+/g, "_")
    .toLowerCase();

  const aliased = typeAliases[normalized];
  if (aliased) {
    return aliased;
  }

  return normalized.endsWith(TRIGGER_SUFFIX)
    ? normalized.slice(0, -TRIGGER_SUFFIX.length)
    : normalized;
}

export function isTriggerNodeType(
  type: string,
  triggerType = "manual",
): boolean {
  return canonicalNodeType(type) === canonicalNodeType(triggerType);
}

/**
 * True when a UI node type follows the `*_TRIGGER` naming convention. The
 * engine uses this to recognise triggers contributed by feature modules without
 * hardcoding a list of domain node types.
 */
export function isTriggerNodeTypeName(
  type: string | null | undefined,
): boolean {
  return (
    typeof type === "string" && /_TRIGGER$/.test(type.trim().toUpperCase())
  );
}

export function toJsonValue(value: unknown): JsonValue {
  if (value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export const AUTOMATION_LEDGER_MAX_BYTES = 64 * 1024;

function utf8Size(value: string): number {
  return new TextEncoder().encode(value).length;
}

function truncateUtf8(value: string, maxBytes: number): string {
  let low = 0;
  let high = value.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (utf8Size(value.slice(0, middle)) <= maxBytes) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return value.slice(0, low);
}

export function capJsonValue(
  value: JsonValue,
  maxBytes = AUTOMATION_LEDGER_MAX_BYTES,
): JsonValue {
  const serialized = JSON.stringify(value);
  if (utf8Size(serialized) <= maxBytes) {
    return value;
  }

  const prefix = truncateUtf8(
    serialized,
    Math.max(0, maxBytes - utf8Size('{"truncated":true,"value":""}')),
  );

  return {
    truncated: true,
    value: prefix,
  };
}

export function cloneJson<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNode(value: unknown): AutomationNode {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.type !== "string") {
    throw new Error("Automation graph contains an invalid node");
  }

  const data = isRecord(value.data) ? (value.data as JsonObject) : {};

  const credentialId =
    typeof value.credentialId === "string" && value.credentialId.trim().length > 0
      ? value.credentialId
      : typeof data.credentialId === "string" &&
          data.credentialId.trim().length > 0
        ? data.credentialId
        : null;

  return {
    id: value.id,
    type: value.type,
    name: typeof value.name === "string" ? value.name : null,
    data,
    credentialId,
  };
}

function parseConnection(value: unknown): AutomationConnection {
  if (!isRecord(value)) {
    throw new Error("Automation graph contains an invalid connection");
  }

  const fromNodeId =
    typeof value.fromNodeId === "string"
      ? value.fromNodeId
      : typeof value.source === "string"
        ? value.source
        : null;
  const toNodeId =
    typeof value.toNodeId === "string"
      ? value.toNodeId
      : typeof value.target === "string"
        ? value.target
        : null;

  if (!fromNodeId || !toNodeId) {
    throw new Error("Automation graph contains a connection without endpoints");
  }

  return {
    fromNodeId,
    toNodeId,
    fromOutput:
      typeof value.fromOutput === "string"
        ? value.fromOutput
        : typeof value.sourceHandle === "string"
          ? value.sourceHandle
          : "main",
    toInput:
      typeof value.toInput === "string"
        ? value.toInput
        : typeof value.targetHandle === "string"
          ? value.targetHandle
          : "main",
  };
}

export function parseAutomationGraph(value: unknown): AutomationGraph {
  if (!isRecord(value) || !Array.isArray(value.nodes)) {
    throw new Error("Automation graph must contain a nodes array");
  }

  const connections = Array.isArray(value.connections) ? value.connections : [];

  return {
    nodes: value.nodes.map(parseNode),
    connections: connections.map(parseConnection),
  };
}

export function findNode(
  graph: AutomationGraph,
  nodeId: string,
): AutomationNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

export function findStartNodes(
  graph: AutomationGraph,
  triggerType: string,
): AutomationNode[] {
  return graph.nodes.filter((node) =>
    isTriggerNodeType(node.type, triggerType),
  );
}

export function getOutgoingConnections(
  graph: AutomationGraph,
  nodeId: string,
  outputPort = "main",
): AutomationConnection[] {
  return graph.connections.filter(
    (connection) =>
      connection.fromNodeId === nodeId && connection.fromOutput === outputPort,
  );
}

export function isExecutableNode(node: AutomationNode): boolean {
  return canonicalNodeType(node.type) !== "initial";
}
