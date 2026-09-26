import { describe, expect, it } from "vitest";

import { createInMemoryEffects } from "../effects";
import { defaultNodeRegistry } from "../node-registry";

const emptyContext = {
  input: null,
  payload: null,
  run: { id: "run-1", triggerType: "manual" },
  step: { id: "step-1", attempts: 0 },
  now: new Date("2026-01-01T00:00:00.000Z"),
  effects: createInMemoryEffects(),
};

describe("conditional node handler", () => {
  it("routes to the true port when the condition matches", () => {
    const handler = defaultNodeRegistry.conditional;

    const result = handler({
      ...emptyContext,
      node: {
        id: "cond",
        type: "conditional",
        data: { path: "status", operator: "equals", value: "vip" },
      },
      input: { status: "vip" },
    });

    expect(result).toEqual({
      output: { value: "vip", matched: true },
      outputPort: "true",
    });
  });

  it("routes to the false port when the condition does not match", () => {
    const handler = defaultNodeRegistry.conditional;

    const result = handler({
      ...emptyContext,
      node: {
        id: "cond",
        type: "conditional",
        data: { path: "status", operator: "equals", value: "vip" },
      },
      input: { status: "free" },
    });

    expect(result).toEqual({
      output: { value: "free", matched: false },
      outputPort: "false",
    });
  });

  it("interpolates template expressions in the condition config", () => {
    const handler = defaultNodeRegistry.conditional;

    const result = handler({
      ...emptyContext,
      node: {
        id: "cond",
        type: "conditional",
        data: {
          path: "department",
          operator: "equals",
          value: "{{ payload.department }}",
        },
      },
      input: { department: "engineering" },
      payload: { department: "engineering" },
    });

    expect(result).toEqual({
      output: { value: "engineering", matched: true },
      outputPort: "true",
    });
  });

  it("evaluates against the payload when source is payload", () => {
    const handler = defaultNodeRegistry.conditional;

    const result = handler({
      ...emptyContext,
      node: {
        id: "cond",
        type: "conditional",
        data: { source: "payload", path: "formId", operator: "equals", value: "f1" },
      },
      input: { formId: "f2" },
      payload: { formId: "f1" },
    });

    expect(result).toEqual({
      output: { value: "f1", matched: true },
      outputPort: "true",
    });
  });
});

describe("wait node handler", () => {
  it("interprets object duration fields as milliseconds", () => {
    const handler = defaultNodeRegistry.wait;
    const now = new Date("2026-01-01T00:00:00.000Z");
    const effects = createInMemoryEffects();

    const result = handler({
      node: {
        id: "wait",
        type: "wait",
        data: { duration: { seconds: 30, minutes: 1 } },
      },
      input: null,
      payload: null,
      run: { id: "run-1", triggerType: "manual" },
      step: { id: "step-1", attempts: 0 },
      now,
      effects,
    });

    expect(result).toEqual({
      output: null,
      resumeAt: new Date(now.getTime() + 30_000 + 60_000),
    });
  });
});
