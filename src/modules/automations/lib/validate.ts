import { INITIAL_NODE_TYPE, TRIGGER_NODE_TYPES } from "../constants";
import { isTriggerNodeTypeName } from "./graph";

export type GraphNode = {
  id: string;
  type: string | null | undefined;
  /** Node configuration, inspected by module-contributed validators. */
  data?: Record<string, unknown>;
};

export type GraphEdge = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * A module-contributed, per-node publish check. Returns a failure reason or
 * `null` when the node is fine. Keeps domain rules (e.g. "this trigger needs a
 * form") in the owning module instead of the engine.
 */
export type NodeValidator = (node: GraphNode) => string | null;

export interface ValidateAutomationGraphOptions {
  nodeValidators?: NodeValidator[];
}

/**
 * Returns a node's effective output/input port name, defaulting to "main" so
 * edges without an explicit handle are compared and stored consistently.
 */
const portName = (handle: string | null | undefined) => handle || "main";

/**
 * True when the directed graph (source -> target) contains at least one cycle.
 * Iterative DFS with three-color marking; nodes not reachable from any edge are
 * trivially acyclic.
 */
export function hasCycle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    if (adjacency.has(edge.source)) {
      adjacency.get(edge.source)!.push(edge.target);
    }
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const state = new Map<string, number>();

  const visit = (id: string): boolean => {
    const current = state.get(id) ?? WHITE;
    if (current === GRAY) {
      return true;
    }
    if (current === BLACK) {
      return false;
    }

    state.set(id, GRAY);
    for (const next of adjacency.get(id) ?? []) {
      if (visit(next)) {
        return true;
      }
    }
    state.set(id, BLACK);
    return false;
  };

  for (const id of adjacency.keys()) {
    if (visit(id)) {
      return true;
    }
  }
  return false;
}

/**
 * Validates a workflow graph before publishing. The graph must contain at
 * least one trigger node, no dangling edges and no cycles; identical duplicate
 * edges are rejected as well (the DB enforces the same rule with a friendlier
 * error here).
 */
export function validateAutomationGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: ValidateAutomationGraphOptions = {},
): ValidationResult {
  const hasTrigger = nodes.some(
    (node) =>
      node.type != null &&
      ((TRIGGER_NODE_TYPES as readonly string[]).includes(node.type) ||
        isTriggerNodeTypeName(node.type)),
  );

  if (!hasTrigger) {
    return {
      valid: false,
      reason: "At least one trigger node is required to publish",
    };
  }

  for (const validateNode of options.nodeValidators ?? []) {
    for (const node of nodes) {
      const reason = validateNode(node);
      if (reason) {
        return { valid: false, reason };
      }
    }
  }

  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (node.type !== INITIAL_NODE_TYPE) {
      nodeIds.add(node.id);
    }
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      return {
        valid: false,
        reason: `Connection ${edge.source} -> ${edge.target}: source node not found`,
      };
    }
    if (!nodeIds.has(edge.target)) {
      return {
        valid: false,
        reason: `Connection ${edge.source} -> ${edge.target}: target node not found`,
      };
    }
  }

  const seenPorts = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.source}|${edge.target}|${portName(
      edge.sourceHandle,
    )}|${portName(edge.targetHandle)}`;
    if (seenPorts.has(key)) {
      return {
        valid: false,
        reason: `Duplicate connection between ${edge.source} and ${edge.target}`,
      };
    }
    seenPorts.add(key);
  }

  if (hasCycle(nodes, edges)) {
    return { valid: false, reason: "Cycles are not allowed in an automation" };
  }

  return { valid: true };
}