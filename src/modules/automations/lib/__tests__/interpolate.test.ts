import { describe, expect, it } from "vitest";

import { interpolateAutomationValue } from "../interpolate";

const context = {
  input: { name: "Ada", score: 42, active: true },
  payload: { formId: "f1" },
  run: { id: "run-1", triggerType: "manual" },
  step: { id: "step-1", attempts: 2 },
};

describe("interpolateAutomationValue", () => {
  it("returns non-string values unchanged", () => {
    expect(interpolateAutomationValue(42, context)).toBe(42);
    expect(interpolateAutomationValue(true, context)).toBe(true);
    expect(interpolateAutomationValue(null, context)).toBeNull();
  });

  it("returns strings without templates unchanged", () => {
    expect(interpolateAutomationValue("hello", context)).toBe("hello");
  });

  it("resolves a whole-string expression to its raw value", () => {
    expect(interpolateAutomationValue("{{ input.score }}", context)).toBe(42);
    expect(interpolateAutomationValue("{{ input.active }}", context)).toBe(true);
    expect(interpolateAutomationValue("{{ input }}", context)).toEqual({
      name: "Ada",
      score: 42,
      active: true,
    });
  });

  it("interpolates mixed strings with text", () => {
    expect(
      interpolateAutomationValue("Hello {{ input.name }}", context),
    ).toBe("Hello Ada");
  });

  it("uses an empty string for missing mixed values", () => {
    expect(
      interpolateAutomationValue("{{ input.missing }}tail", context),
    ).toBe("tail");
  });

  it("recursively interpolates object values", () => {
    expect(
      interpolateAutomationValue(
        { greeting: "Hi {{ input.name }}", score: "{{ input.score }}" },
        context,
      ),
    ).toEqual({ greeting: "Hi Ada", score: 42 });
  });

  it("recursively interpolates arrays", () => {
    expect(
      interpolateAutomationValue(
        ["{{ input.name }}", "{{ payload.formId }}"],
        context,
      ),
    ).toEqual(["Ada", "f1"]);
  });

  it("exposes run and step context", () => {
    expect(interpolateAutomationValue("{{ run.id }}", context)).toBe("run-1");
    expect(interpolateAutomationValue("{{ step.attempts }}", context)).toBe(2);
  });
});
