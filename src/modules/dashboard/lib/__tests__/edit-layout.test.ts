import { describe, expect, it } from "vitest";

import type { DashboardWidgetInstance } from "@/shared/dashboard/types";

import {
  addInstance,
  createInstanceKey,
  moveInstance,
  removeInstance,
  updateInstance,
} from "../edit-layout";

const instance = (
  key: string,
  definitionId: string,
  overrides: Partial<DashboardWidgetInstance> = {},
): DashboardWidgetInstance => ({ key, definitionId, ...overrides });

const keys = (instances: DashboardWidgetInstance[]) =>
  instances.map((entry) => entry.key);

describe("updateInstance", () => {
  it("applies a patch to exactly the keyed instance", () => {
    const layout = [instance("a", "a"), instance("b", "b")];

    const result = updateInstance(layout, "a", { size: "full" });

    expect(result[0]).toEqual({ key: "a", definitionId: "a", size: "full" });
    expect(result[1]).toEqual({ key: "b", definitionId: "b" });
  });

  it("overrides a previous size on the same instance", () => {
    const layout = [instance("a", "a", { size: "small" })];

    const result = updateInstance(layout, "a", { size: "medium" });

    expect(result[0]).toEqual({ key: "a", definitionId: "a", size: "medium" });
  });

  it("replaces the config of exactly the keyed instance", () => {
    const layout = [
      instance("trend-contacts", "trend", { config: { metric: "contacts" } }),
      instance("trend-submissions", "trend", { config: { metric: "submissions" } }),
    ];

    const result = updateInstance(layout, "trend-contacts", {
      config: { metric: "revenue" },
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

    expect(updateInstance(layout, "ghost", { size: "full" })).toEqual(layout);
  });
});

describe("addInstance", () => {
  it("appends a new instance at the end", () => {
    const layout = [instance("a", "a")];

    const result = addInstance(layout, "b", "b-1");

    expect(keys(result)).toEqual(["a", "b-1"]);
    expect(result[1]).toEqual({ key: "b-1", definitionId: "b" });
  });

  it("appends a second instance while one already exists", () => {
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
});

describe("removeInstance", () => {
  it("removes exactly the keyed instance", () => {
    const layout = [instance("a", "a"), instance("b", "b"), instance("c", "c")];

    const result = removeInstance(layout, "b");

    expect(keys(result)).toEqual(["a", "c"]);
  });

  it("leaves the layout untouched when the key is absent", () => {
    const layout = [instance("a", "a")];

    expect(removeInstance(layout, "ghost")).toEqual(layout);
  });
});

describe("moveInstance", () => {
  it("moves an instance to the slot of the target key", () => {
    const layout = [instance("a", "a"), instance("b", "b"), instance("c", "c")];

    const result = moveInstance(layout, "a", "c");

    expect(keys(result)).toEqual(["b", "c", "a"]);
  });

  it("moves an instance backwards to the slot of the target key", () => {
    const layout = [instance("a", "a"), instance("b", "b"), instance("c", "c")];

    const result = moveInstance(layout, "c", "a");

    expect(keys(result)).toEqual(["c", "a", "b"]);
  });

  it("returns the layout unchanged when a key is unknown or equal", () => {
    const layout = [instance("a", "a"), instance("b", "b")];

    expect(moveInstance(layout, "a", "a")).toBe(layout);
    expect(moveInstance(layout, "a", "ghost")).toBe(layout);
    expect(moveInstance(layout, "ghost", "b")).toBe(layout);
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
