import { describe, expect, it } from "vitest";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
  WidgetGridPlacement,
} from "@/shared/dashboard/types";

import {
  addInstance,
  applyGridLayout,
  createInstanceKey,
  removeInstance,
  updateInstance,
} from "../edit-layout";

const definition = (
  overrides: Partial<WidgetDefinition> = {},
): WidgetDefinition =>
  ({
    id: "widget",
    title: "Widget",
    icon: undefined as unknown as WidgetDefinition["icon"],
    group: "content",
    defaultSize: "medium",
    component: () => null,
    ...overrides,
  }) as WidgetDefinition;

const placement = (x: number, y: number, w: number, h: number): WidgetGridPlacement => ({
  x,
  y,
  w,
  h,
});

const instance = (
  key: string,
  definitionId: string,
  overrides: Partial<DashboardWidgetInstance> = {},
): DashboardWidgetInstance => ({
  key,
  definitionId,
  grid: placement(0, 0, 6, 4),
  ...overrides,
});

const keys = (instances: DashboardWidgetInstance[]) =>
  instances.map((entry) => entry.key);

describe("updateInstance", () => {
  it("applies a patch to exactly the keyed instance", () => {
    const layout = [instance("a", "a"), instance("b", "b")];

    const result = updateInstance(layout, "a", { title: "Renamed" });

    expect(result[0].title).toBe("Renamed");
    expect(result[1].title).toBeUndefined();
  });

  it("replaces the placement of exactly the keyed instance", () => {
    const layout = [instance("a", "a"), instance("b", "b")];

    const result = updateInstance(layout, "a", {
      grid: placement(6, 0, 3, 3),
    });

    expect(result[0].grid).toEqual(placement(6, 0, 3, 3));
    expect(result[1].grid).toEqual(placement(0, 0, 6, 4));
  });

  it("replaces the config of exactly the keyed instance", () => {
    const layout = [
      instance("trend-contacts", "trend", { config: { metric: "contacts" } }),
      instance("trend-submissions", "trend", { config: { metric: "submissions" } }),
    ];

    const result = updateInstance(layout, "trend-contacts", {
      config: { metric: "revenue" },
    });

    expect(result[0].config).toEqual({ metric: "revenue" });
    expect(result[1].config).toEqual({ metric: "submissions" });
  });

  it("leaves the layout untouched when the key is absent", () => {
    const layout = [instance("a", "a")];

    expect(updateInstance(layout, "ghost", { title: "Renamed" })).toEqual(layout);
  });
});

describe("applyGridLayout", () => {
  it("applies each item's placement to its keyed instance", () => {
    const layout = [
      instance("a", "a", { grid: placement(0, 0, 6, 4) }),
      instance("b", "b", { grid: placement(6, 0, 6, 4) }),
    ];

    const result = applyGridLayout(layout, [
      { i: "a", x: 6, y: 2, w: 3, h: 5 },
      { i: "b", x: 0, y: 0, w: 9, h: 3 },
    ]);

    expect(result[0].grid).toEqual(placement(6, 2, 3, 5));
    expect(result[1].grid).toEqual(placement(0, 0, 9, 3));
  });

  it("leaves an instance off the grid at its placement", () => {
    const layout = [
      instance("shown", "shown"),
      instance("hidden", "hidden", { grid: placement(0, 4, 3, 3) }),
    ];

    const result = applyGridLayout(layout, [
      { i: "shown", x: 3, y: 0, w: 3, h: 3 },
    ]);

    expect(result[1].grid).toEqual(placement(0, 4, 3, 3));
  });

  it("ignores items with no matching instance", () => {
    const layout = [instance("a", "a")];

    const result = applyGridLayout(layout, [
      { i: "a", x: 1, y: 1, w: 3, h: 3 },
      { i: "ghost", x: 6, y: 0, w: 6, h: 4 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].grid).toEqual(placement(1, 1, 3, 3));
  });

  it("keeps an instance's identity when its placement is unchanged", () => {
    const unchanged = instance("a", "a", { grid: placement(0, 0, 6, 4) });
    const moved = instance("b", "b", { grid: placement(6, 0, 6, 4) });

    const result = applyGridLayout([unchanged, moved], [
      { i: "a", x: 0, y: 0, w: 6, h: 4 },
      { i: "b", x: 0, y: 4, w: 6, h: 4 },
    ]);

    expect(result[0]).toBe(unchanged);
    expect(result[1]).not.toBe(moved);
  });

  it("does not mutate the input", () => {
    const layout = [instance("a", "a", { grid: placement(0, 0, 6, 4) })];

    applyGridLayout(layout, [{ i: "a", x: 6, y: 0, w: 6, h: 4 }]);

    expect(layout[0].grid).toEqual(placement(0, 0, 6, 4));
  });
});

describe("addInstance", () => {
  it("appends a new instance in the first free slot for its preset", () => {
    const layout = [instance("a", "a", { grid: placement(0, 0, 3, 3) })];

    const result = addInstance(layout, definition({ id: "b", defaultSize: "small" }), "b-1");

    expect(keys(result)).toEqual(["a", "b-1"]);
    expect(result[1]).toMatchObject({
      key: "b-1",
      definitionId: "b",
      grid: { x: 3, y: 0, w: 3, h: 3 },
    });
  });

  it("places a second instance after the first, in the next slot", () => {
    const layout = [instance("trend-contacts", "trend")];

    const result = addInstance(
      layout,
      definition({ id: "trend", defaultSize: "small" }),
      "trend-revenue",
    );

    expect(keys(result)).toEqual(["trend-contacts", "trend-revenue"]);
    expect(result[1].grid).toEqual({ x: 6, y: 0, w: 3, h: 3 });
  });

  it("seeds a freshly appended instance with the definition's default config", () => {
    const result = addInstance(
      [],
      definition({ id: "trend", defaultSize: "small" }),
      "trend-1",
      { metric: "contacts" },
    );

    expect(result[0]).toMatchObject({
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
