import { describe, expect, it } from "vitest";

import type { WidgetConfigSelectField } from "../../types";
import { configFieldValue, withConfigValue } from "../config";

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
