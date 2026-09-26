import { format } from "date-fns";

import { parseAutomationGraph } from "./graph";

export type RunNodeLabel = {
  type: string;
  name: string | null;
};

function labelForNode(node: {
  name: string | null;
  data: Record<string, unknown>;
}): string | null {
  for (const key of ["label", "name"] as const) {
    const value = node.data?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return node.name ?? null;
}

/** Parse a Run's frozen graph into a nodeId → label lookup, tolerating malformed snapshots. */
export function resolveRunNodes(graph: unknown): Record<string, RunNodeLabel> {
  try {
    const parsed = parseAutomationGraph(graph);
    const nodes: Record<string, RunNodeLabel> = {};

    for (const node of parsed.nodes) {
      nodes[node.id] = {
        type: node.type,
        name: labelForNode({
          name: node.name ?? null,
          data: node.data as Record<string, unknown>,
        }),
      };
    }

    return nodes;
  } catch {
    return {};
  }
}

/** Human-readable timestamp for the Run ledger; "—" when a Step has no time yet. */
export function formatRunDate(value: Date | null): string {
  return value ? format(new Date(value), "PP p") : "—";
}

/** Human-readable wall-clock duration of a finished Run; "—" while it is open. */
export function formatDuration(
  startedAt: Date | string,
  endedAt: Date | string | null,
): string {
  if (!endedAt) {
    return "—";
  }

  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) {
    return "—";
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`;
  }

  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/**
 * The engine caps oversized snapshots with `capJsonValue`, which stores
 * `{ truncated: true, value: <prefix> }` (see lib/graph.ts).
 */
export function isTruncatedSnapshot(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).truncated === true
  );
}

export function formatSnapshotForDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (isTruncatedSnapshot(value)) {
    const prefix = (value as { value?: unknown }).value;
    return typeof prefix === "string" ? prefix : "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseBoundary(
  value: string | null | undefined,
  boundary: "start" | "end",
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const candidate = DATE_ONLY.test(value)
    ? new Date(
        boundary === "start"
          ? `${value}T00:00:00.000Z`
          : `${value}T23:59:59.999Z`,
      )
    : new Date(value);

  return Number.isNaN(candidate.getTime()) ? undefined : candidate;
}

/** Turn the UI's from/to filter strings into an inclusive `startedAt` range. */
export function parseRunDateRange(input: {
  from?: string | null;
  to?: string | null;
}): { gte?: Date; lte?: Date } {
  return {
    gte: parseBoundary(input.from, "start"),
    lte: parseBoundary(input.to, "end"),
  };
}
