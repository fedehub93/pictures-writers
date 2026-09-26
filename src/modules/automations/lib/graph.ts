import type { Prisma } from "@/generated/prisma";

export type JsonValue = Prisma.JsonValue;
export type JsonObject = { [key: string]: JsonValue };

export type AutomationNode = {
  id: string;
  type: string;
  name?: string | null;
  data: JsonObject;
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

export function canonicalNodeType(type: string): string {
  const normalized = type
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();

  return typeAliases[normalized] ?? normalized;
}

export function isTriggerNodeType(
  type: string,
  triggerType = "manual",
): boolean {
  return canonicalNodeType(type) === canonicalNodeType(triggerType);
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

  return {
    id: value.id,
    type: value.type,
    name: typeof value.name === "string" ? value.name : null,
    data,
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
