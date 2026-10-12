import { describe, expect, it } from "vitest";

import type { DashboardWidgetInstance } from "../../types";
import {
  addInstance,
  configureInstance,
  createInstanceKey,
  hideInstance,
  moveInstance,
} from "../edit-layout";

const instance = (
  key: string,
  definitionId: string,
  overrides: Partial<DashboardWidgetInstance> = {},
): DashboardWidgetInstance => ({ key, definitionId, ...overrides });

const keys = (instances: DashboardWidgetInstance[]) =>
  instances.map((entry) => entry.key);

describe("hideInstance", () => {
  it("marks the instance with the given key as hidden", () => {
    const layout = [instance("a", "a"), instance("b", "b")];

    const result = hideInstance(layout, "a");

    expect(result[0]).toEqual({ key: "a", definitionId: "a", hidden: true });
    expect(result[1]).toEqual({ key: "b", definitionId: "b" });
  });

  it("leaves the layout untouched when the key is absent", () => {
    const layout = [instance("a", "a")];

    expect(hideInstance(layout, "ghost")).toEqual(layout);
  });
});

describe("addInstance", () => {
  it("appends a new instance when the definition is not present", () => {
    const layout = [instance("a", "a")];

    const result = addInstance(layout, "b", "b-1");

    expect(keys(result)).toEqual(["a", "b-1"]);
    expect(result[1]).toEqual({ key: "b-1", definitionId: "b" });
  });

  it("re-shows the first hidden instance of the definition instead of duplicating", () => {
    const layout = [
      instance("a", "a"),
      instance("b", "b", { hidden: true }),
    ];

    const result = addInstance(layout, "b", "b-new");

    expect(keys(result)).toEqual(["a", "b"]);
    expect(result[1]).toEqual({ key: "b", definitionId: "b", hidden: false });
  });

  it("appends a second instance while a visible one already exists", () => {
    const layout = [instance("trend-contacts", "trend")];

    const result = addInstance(layout, "trend", "trend-revenue");

    expect(keys(result)).toEqual(["trend-contacts", "trend-revenue"]);
  });

  it("seeds a freshly appended instance with the definition's default config", () => {
    const result = addInstance([], "trend", "trend-1", { metric: "contacts" });

    expect(result[0]).toEqual({
      key: "trend-1",
      definitionId: "trend",
      config: { metric: "contacts" },
    });
  });

  it("keeps a re-shown hidden instance's own config", () => {
    const layout = [
      instance("trend-contacts", "trend", { config: { metric: "contacts" }, hidden: true }),
    ];

    const result = addInstance(layout, "trend", "trend-new", {
      metric: "revenue",
    });

    expect(result[0]).toEqual({
      key: "trend-contacts",
      definitionId: "trend",
      config: { metric: "contacts" },
      hidden: false,
    });
  });
});

describe("configureInstance", () => {
  it("replaces the config of exactly the keyed instance", () => {
    const layout = [
      instance("trend-contacts", "trend", { config: { metric: "contacts" } }),
      instance("trend-submissions", "trend", { config: { metric: "submissions" } }),
    ];

    const result = configureInstance(layout, "trend-contacts", {
      metric: "revenue",
    });

    expect(result[0]).toEqual({
      key: "trend-contacts",
      definitionId: "trend",
      config: { metric: "revenue" },
    });
    expect(result[1]).toEqual({
      key: "trend-submissions",
      definitionId: "trend",
      config: { metric: "submissions" },
    });
  });

  it("leaves the layout untouched when the key is absent", () => {
    const layout = [instance("a", "a")];

    expect(configureInstance(layout, "ghost", { metric: "x" })).toEqual(layout);
  });
});

describe("moveInstance", () => {
  it("reorders visible instances by their visible positions", () => {
    const layout = [instance("a", "a"), instance("b", "b"), instance("c", "c")];

    const result = moveInstance(layout, 0, 2);

    expect(keys(result)).toEqual(["b", "c", "a"]);
  });

  it("keeps hidden instances in place while reordering the visible ones", () => {
    const layout = [
      instance("a", "a"),
      instance("hidden", "x", { hidden: true }),
      instance("b", "b"),
      instance("c", "c"),
    ];

    const result = moveInstance(layout, 0, 2);

    expect(keys(result)).toEqual(["b", "hidden", "c", "a"]);
  });

  it("returns the layout unchanged when the positions are invalid or equal", () => {
    const layout = [instance("a", "a"), instance("b", "b")];

    expect(moveInstance(layout, 1, 1)).toBe(layout);
    expect(moveInstance(layout, 0, 9)).toBe(layout);
  });
});

describe("createInstanceKey", () => {
  it("prefixes the definition id and stays unique", () => {
    const first = createInstanceKey("trend");
    const second = createInstanceKey("trend");

    expect(first.startsWith("trend-")).toBe(true);
    expect(first).not.toBe(second);
  });

  it("uses a UUID suffix", () => {
    const suffix = createInstanceKey("trend").replace("trend-", "");

    expect(suffix).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
