import { describe, expect, it } from "vitest";

import type {
  WidgetConfigMultiSelectField,
  WidgetConfigSelectField,
} from "@/shared/dashboard/types";
import {
  configFieldValue,
  configFieldValues,
  withConfigValue,
  withConfigValues,
} from "../config";

const field: WidgetConfigSelectField = {
  type: "select",
  name: "metric",
  label: "Metric",
  options: [
    { value: "contacts", label: "Contacts" },
    { value: "submissions", label: "Form submissions" },
  ],
};

describe("configFieldValue", () => {
  it("returns the stored value when it is still an option", () => {
    expect(configFieldValue({ metric: "submissions" }, field)).toBe(
      "submissions",
    );
  });

  it("falls back to the first option when the value is absent or of another type", () => {
    expect(configFieldValue(undefined, field)).toBe("contacts");
    expect(configFieldValue(null, field)).toBe("contacts");
    expect(configFieldValue({}, field)).toBe("contacts");
    expect(configFieldValue({ metric: 42 }, field)).toBe("contacts");
  });

  it("falls back to the first option when the stored value is no longer offered", () => {
    expect(configFieldValue({ metric: "ghost" }, field)).toBe("contacts");
  });

  it("returns undefined when the field offers no option", () => {
    expect(configFieldValue(undefined, { ...field, options: [] })).toBeUndefined();
  });
});

describe("withConfigValue", () => {
  it("sets the field while preserving the other config keys", () => {
    expect(withConfigValue({ metric: "contacts", other: 1 }, field, "submissions")).toEqual(
      { metric: "submissions", other: 1 },
    );
  });

  it("builds a config when there was none", () => {
    expect(withConfigValue(undefined, field, "submissions")).toEqual({
      metric: "submissions",
    });
  });
});

const multiField: WidgetConfigMultiSelectField = {
  type: "multiselect",
  name: "statuses",
  label: "Statuses",
  options: [
    { value: "DRAFT", label: "Draft" },
    { value: "CHANGED", label: "Changed" },
    { value: "PUBLISHED", label: "Published" },
  ],
};

describe("configFieldValues", () => {
  it("keeps the stored values that are still options", () => {
    expect(configFieldValues({ statuses: ["DRAFT", "PUBLISHED"] }, multiField)).toEqual(
      ["DRAFT", "PUBLISHED"],
    );
  });

  it("drops values that are no longer options and non-string entries", () => {
    expect(
      configFieldValues({ statuses: ["DRAFT", "ghost", 42] }, multiField),
    ).toEqual(["DRAFT"]);
  });

  it("returns an empty selection when the stored value is absent or malformed", () => {
    expect(configFieldValues(undefined, multiField)).toEqual([]);
    expect(configFieldValues({ statuses: "DRAFT" }, multiField)).toEqual([]);
  });
});

describe("withConfigValues", () => {
  it("replaces the field while preserving the other config keys", () => {
    expect(
      withConfigValues({ statuses: ["DRAFT"], other: 1 }, multiField, [
        "CHANGED",
      ]),
    ).toEqual({ statuses: ["CHANGED"], other: 1 });
  });

  it("builds a config when there was none", () => {
    expect(withConfigValues(undefined, multiField, ["DRAFT"])).toEqual({
      statuses: ["DRAFT"],
    });
  });
});
