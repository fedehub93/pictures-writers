import { describe, expect, it } from "vitest";

import { configDiffersFromDefault, configStringValues } from "../config";

describe("configStringValues", () => {
  it("returns the stored string entries, dropping non-strings", () => {
    expect(configStringValues({ forms: ["a", 2, "b"] }, "forms")).toEqual([
      "a",
      "b",
    ]);
  });

  it("returns an empty array when the stored value is absent or malformed", () => {
    expect(configStringValues(undefined, "forms")).toEqual([]);
    expect(configStringValues({ forms: "a" }, "forms")).toEqual([]);
    expect(configStringValues({}, "forms")).toEqual([]);
  });
});

describe("configDiffersFromDefault", () => {
  const fallback = { statuses: ["DRAFT", "CHANGED"] };

  it("is false when the definition declares no default", () => {
    expect(configDiffersFromDefault(undefined, { metric: "contacts" })).toBe(
      false,
    );
  });

  it("is false when the instance carries no config", () => {
    expect(configDiffersFromDefault(fallback, undefined)).toBe(false);
    expect(configDiffersFromDefault(fallback, null)).toBe(false);
  });

  it("is false when the config still matches the default, in any order", () => {
    expect(
      configDiffersFromDefault(fallback, { statuses: ["DRAFT", "CHANGED"] }),
    ).toBe(false);
    expect(
      configDiffersFromDefault(fallback, { statuses: ["CHANGED", "DRAFT"] }),
    ).toBe(false);
  });

  it("is true when a selection changed", () => {
    expect(configDiffersFromDefault(fallback, { statuses: ["DRAFT"] })).toBe(
      true,
    );
  });

  it("is true when keys are added or dropped", () => {
    expect(
      configDiffersFromDefault(fallback, { statuses: ["DRAFT"], extra: 1 }),
    ).toBe(true);
  });
});
