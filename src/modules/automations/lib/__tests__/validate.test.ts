import { describe, expect, it } from "vitest";

import {
  hasCycle,
  validateAutomationGraph,
  type GraphEdge,
  type GraphNode,
} from "../validate";

const trigger = (id: string): GraphNode => ({ id, type: "MANUAL_TRIGGER" });
const action = (id: string): GraphNode => ({ id, type: "HTTP_REQUEST" });
const edge = (
  source: string,
  target: string,
  overrides?: Partial<GraphEdge>,
): GraphEdge => ({ source, target, ...overrides });

describe("hasCycle", () => {
  it("detects a direct self loop", () => {
    const nodes = [action("a")];
    expect(hasCycle(nodes, [edge("a", "a")])).toBe(true);
  });

  it("detects a cycle along a chain", () => {
    const nodes = [action("a"), action("b"), action("c")];
    const edges = [edge("a", "b"), edge("b", "c"), edge("c", "a")];
    expect(hasCycle(nodes, edges)).toBe(true);
  });

  it("accepts a DAG with fan-out", () => {
    const nodes = [trigger("t"), action("a"), action("b")];
    const edges = [edge("t", "a"), edge("t", "b"), edge("a", "b")];
    expect(hasCycle(nodes, edges)).toBe(false);
  });

  it("is fair with edges that reference unknown nodes", () => {
    const nodes = [trigger("t"), action("a")];
    const edges = [edge("t", "ghost"), edge("ghost", "t")];
    expect(hasCycle(nodes, edges)).toBe(false);
  });
});

describe("validateAutomationGraph", () => {
  it("rejects a graph without a trigger", () => {
    const result = validateAutomationGraph([action("a")], []);
    expect(result).toEqual({
      valid: false,
      reason: "At least one trigger node is required to publish",
    });
  });

  it("does not count the INITIAL placeholder as a trigger", () => {
    const result = validateAutomationGraph(
      [{ id: "init", type: "INITIAL" }],
      [],
    );
    expect(result.valid).toBe(false);
  });

  it("accepts a trigger-only graph", () => {
    expect(validateAutomationGraph([trigger("t")], [])).toEqual({ valid: true });
  });

  it("accepts cron and webhook triggers", () => {
    expect(
      validateAutomationGraph([{ id: "c", type: "CRON_TRIGGER" }], []),
    ).toEqual({ valid: true });
    expect(
      validateAutomationGraph([{ id: "w", type: "WEBHOOK_TRIGGER" }], []),
    ).toEqual({ valid: true });
  });

  it("accepts a trigger -> action chain", () => {
    const result = validateAutomationGraph(
      [trigger("t"), action("a")],
      [edge("t", "a")],
    );
    expect(result).toEqual({ valid: true });
  });

  it("rejects an edge whose source or target does not exist", () => {
    const result = validateAutomationGraph(
      [trigger("t")],
      [edge("t", "missing")],
    );
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toMatch(/not found/i);
  });

  it("rejects a cycle (trigger -> a -> b -> trigger)", () => {
    const result = validateAutomationGraph(
      [trigger("t"), action("a"), action("b")],
      [edge("t", "a"), edge("a", "b"), edge("b", "t")],
    );
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toMatch(/cycle/i);
  });

  it("rejects identical duplicate edges but allows distinct output ports", () => {
    const base = validateAutomationGraph(
      [trigger("t"), action("a")],
      [edge("t", "a"), edge("t", "a")],
    );
    expect(base.valid).toBe(false);
    expect(base.valid === false && base.reason).toMatch(/duplicate/i);

    const branched = validateAutomationGraph(
      [trigger("t"), action("a")],
      [edge("t", "a"), edge("t", "a", { sourceHandle: "other" })],
    );
    expect(branched).toEqual({ valid: true });
  });
});