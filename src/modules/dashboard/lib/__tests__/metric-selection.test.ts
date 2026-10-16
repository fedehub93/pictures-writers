import { describe, expect, it } from "vitest";

import { resolveMetric } from "../metric-selection";

const metrics = [
  { id: "contacts", label: "Contacts" },
  { id: "submissions", label: "Form submissions" },
];

describe("resolveMetric", () => {
  it("returns the configured metric when the user is permitted to read it", () => {
    expect(resolveMetric({ metric: "submissions" }, metrics)).toEqual({
      id: "submissions",
      label: "Form submissions",
    });
  });

  it("returns null when the configured metric is not permitted, instead of a different one", () => {
    expect(resolveMetric({ metric: "revenue" }, metrics)).toBeNull();
  });

  it("falls back to the first permitted metric when the instance carries no config", () => {
    expect(resolveMetric(null, metrics)).toEqual({
      id: "contacts",
      label: "Contacts",
    });
    expect(resolveMetric(undefined, metrics)).toEqual({
      id: "contacts",
      label: "Contacts",
    });
  });

  it("returns null when the user may read no metric", () => {
    expect(resolveMetric({ metric: "contacts" }, [])).toBeNull();
    expect(resolveMetric(null, [])).toBeNull();
  });
});
