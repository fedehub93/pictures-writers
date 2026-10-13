import { describe, expect, it } from "vitest";

import { configStringValues, summarizeMultiselect } from "../config";

const options = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

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

describe("summarizeMultiselect", () => {
  it("returns no chip when the value matches the default, in any order", () => {
    expect(
      summarizeMultiselect(undefined, "statuses", options, [
        "DRAFT",
        "PUBLISHED",
      ]),
    ).toEqual([]);
    expect(
      summarizeMultiselect({ statuses: ["PUBLISHED", "DRAFT"] }, "statuses", options, [
        "DRAFT",
        "PUBLISHED",
      ]),
    ).toEqual([]);
  });

  it("summarizes a value that differs from the default with the option labels", () => {
    expect(
      summarizeMultiselect({ statuses: ["DRAFT"] }, "statuses", options, [
        "DRAFT",
        "PUBLISHED",
      ]),
    ).toEqual([{ key: "statuses", label: "Draft" }]);
  });

  it("falls back to the raw value when it is not an option", () => {
    expect(
      summarizeMultiselect({ statuses: ["GHOST"] }, "statuses", options, [
        "DRAFT",
      ]),
    ).toEqual([{ key: "statuses", label: "GHOST" }]);
  });
});
