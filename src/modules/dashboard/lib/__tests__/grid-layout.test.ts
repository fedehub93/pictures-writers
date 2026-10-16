import { describe, expect, it } from "vitest";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
  WidgetGridPlacement,
} from "@/shared/dashboard/types";

import {
  firstFreeSlot,
  GRID_COLUMNS,
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  resolveWidgetLayout,
  seedPlacement,
  sortForSingleColumn,
  toGridItems,
  WIDGET_SIZE_PRESETS,
} from "../grid-layout";

describe("grid geometry", () => {
  it("uses a twelve-column grid with an even cell pitch", () => {
    expect(GRID_COLUMNS).toBe(12);
    expect(GRID_ROW_HEIGHT).toBe(64);
    expect(GRID_MARGIN).toBe(12);
  });
});

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

const instance = (
  key: string,
  grid: WidgetGridPlacement,
  overrides: Partial<DashboardWidgetInstance> = {},
): DashboardWidgetInstance => ({ key, definitionId: "widget", grid, ...overrides });

const placement = (x: number, y: number, w: number, h: number): WidgetGridPlacement => ({
  x,
  y,
  w,
  h,
});

describe("resolveWidgetLayout", () => {
  it("resolves each preset to its seed size and minimum bounds", () => {
    expect(resolveWidgetLayout(definition({ defaultSize: "small" }))).toEqual({
      seed: WIDGET_SIZE_PRESETS.small.seed,
      bounds: {
        minW: WIDGET_SIZE_PRESETS.small.min.w,
        minH: WIDGET_SIZE_PRESETS.small.min.h,
        maxW: GRID_COLUMNS,
        maxH: undefined,
      },
    });
  });

  it("defaults a widget's maximum width to the full grid and its height to unbounded", () => {
    const { bounds } = resolveWidgetLayout(definition());
    expect(bounds.maxW).toBe(GRID_COLUMNS);
    expect(bounds.maxH).toBeUndefined();
  });

  it("lets a definition override its minimum placement", () => {
    const { bounds } = resolveWidgetLayout(
      definition({ minGrid: { w: 4, h: 5 } }),
    );
    expect(bounds.minW).toBe(4);
    expect(bounds.minH).toBe(5);
  });

  it("lets a definition override its maximum placement", () => {
    const { bounds } = resolveWidgetLayout(
      definition({ maxGrid: { w: 8, h: 6 } }),
    );
    expect(bounds.maxW).toBe(8);
    expect(bounds.maxH).toBe(6);
  });

  it("clamps the preset seed up into a definition's raised floor", () => {
    const { seed, bounds } = resolveWidgetLayout(
      definition({ defaultSize: "small", minGrid: { w: 6, h: 4 } }),
    );

    expect(bounds.minW).toBe(6);
    expect(seed).toEqual({ w: 6, h: 4 });
  });

  it("clamps the preset seed down into a definition's lowered ceiling", () => {
    const { seed } = resolveWidgetLayout(
      definition({ defaultSize: "full", maxGrid: { w: 4, h: 3 } }),
    );

    expect(seed).toEqual({ w: 4, h: 3 });
  });
});

describe("firstFreeSlot", () => {
  it("returns the origin on an empty grid", () => {
    expect(firstFreeSlot([], { w: 3, h: 2 })).toEqual({ x: 0, y: 0 });
  });

  it("places beside an existing widget when it fits the same row", () => {
    const slot = firstFreeSlot([placement(0, 0, 3, 3)], { w: 3, h: 3 });
    expect(slot).toEqual({ x: 3, y: 0 });
  });

  it("drops to the next row when the widget does not fit alongside", () => {
    const slot = firstFreeSlot(
      [placement(0, 0, 10, 3)],
      { w: 3, h: 3 },
    );
    expect(slot).toEqual({ x: 0, y: 3 });
  });

  it("finds a hole left by a mixed-size arrangement", () => {
    const slot = firstFreeSlot(
      [placement(0, 0, 6, 4), placement(6, 0, 3, 4)],
      { w: 3, h: 4 },
    );
    // Columns 9-12 of row 0 are free (6 + 3 used).
    expect(slot).toEqual({ x: 9, y: 0 });
  });

  it("places below the whole stack when no gap fits", () => {
    const slot = firstFreeSlot(
      [placement(0, 0, 12, 2), placement(0, 2, 12, 3)],
      { w: 6, h: 4 },
    );
    expect(slot).toEqual({ x: 0, y: 5 });
  });

  it("clamps a span wider than the grid to the column count", () => {
    const slot = firstFreeSlot([], { w: 20, h: 2 });
    expect(slot).toEqual({ x: 0, y: 0 });
  });
});

describe("seedPlacement", () => {
  it("seeds a new instance at the preset size in the first free slot", () => {
    const placement = seedPlacement(
      definition({ defaultSize: "small" }),
      [{ x: 0, y: 0, w: 3, h: 3 }],
    );

    expect(placement).toEqual({
      x: 3,
      y: 0,
      w: WIDGET_SIZE_PRESETS.small.seed.w,
      h: WIDGET_SIZE_PRESETS.small.seed.h,
    });
  });
});

describe("sortForSingleColumn", () => {
  it("orders instances by row, then by column", () => {
    const layout = [
      instance("bottom", placement(0, 3, 6, 2)),
      instance("top-right", placement(6, 0, 6, 2)),
      instance("top-left", placement(0, 0, 6, 2)),
    ];

    expect(sortForSingleColumn(layout).map((entry) => entry.key)).toEqual([
      "top-left",
      "top-right",
      "bottom",
    ]);
  });

  it("does not mutate the input", () => {
    const layout = [
      instance("b", placement(0, 2, 6, 2)),
      instance("a", placement(0, 0, 6, 2)),
    ];
    sortForSingleColumn(layout);
    expect(layout.map((entry) => entry.key)).toEqual(["b", "a"]);
  });
});

describe("toGridItems", () => {
  it("attaches each instance's placement and its definition's bounds", () => {
    const items = toGridItems(
      [instance("a", placement(0, 0, 3, 3))],
      [definition({ id: "widget", minGrid: { w: 2, h: 2 } })],
    );

    expect(items).toEqual([
      {
        i: "a",
        x: 0,
        y: 0,
        w: 3,
        h: 3,
        minW: 2,
        minH: 2,
        maxW: GRID_COLUMNS,
        maxH: undefined,
      },
    ]);
  });

  it("drops instances whose definition is unknown", () => {
    const items = toGridItems(
      [instance("ghost", placement(0, 0, 3, 3))],
      [definition({ id: "other" })],
    );
    expect(items).toEqual([]);
  });
});
