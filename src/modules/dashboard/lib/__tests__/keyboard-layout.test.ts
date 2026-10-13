import { describe, expect, it } from "vitest";

import type {
  DashboardWidgetInstance,
  WidgetDefinition,
  WidgetGridPlacement,
} from "@/shared/dashboard/types";

import type { ResolvedWidgetBounds } from "../grid-layout";
import {
  applyLayoutAction,
  canMoveInstance,
  heightStops,
  moveInstance,
  resizeHeight,
  resizeWidth,
  widthStops,
} from "../keyboard-layout";

const bounds = (
  overrides: Partial<ResolvedWidgetBounds> = {},
): ResolvedWidgetBounds => ({
  minW: 2,
  minH: 2,
  maxW: 12,
  ...overrides,
});

const placement = (
  x: number,
  y: number,
  w: number,
  h: number,
): WidgetGridPlacement => ({ x, y, w, h });

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
): DashboardWidgetInstance => ({ key, definitionId: "widget", grid });

describe("widthStops", () => {
  it("lists the preset widths in ascending order", () => {
    expect(widthStops(bounds())).toEqual([
      { label: "Small", value: 3 },
      { label: "Medium", value: 6 },
      { label: "Full", value: 12 },
    ]);
  });

  it("clamps each stop into the definition's width bounds", () => {
    expect(widthStops(bounds({ minW: 4, maxW: 8 }))).toEqual([
      { label: "Small", value: 4 },
      { label: "Medium", value: 6 },
      { label: "Full", value: 8 },
    ]);
  });

  it("collapses stops that clamp onto the same width", () => {
    expect(widthStops(bounds({ minW: 6, maxW: 6 }))).toEqual([
      { label: "Small", value: 6 },
    ]);
  });
});

describe("heightStops", () => {
  it("lists the preset heights in ascending order when unbounded", () => {
    expect(heightStops(bounds())).toEqual([
      { label: "Small", value: 3 },
      { label: "Medium", value: 4 },
      { label: "Full", value: 5 },
    ]);
  });

  it("clamps the stops into a definition's height ceiling", () => {
    expect(heightStops(bounds({ maxH: 4 }))).toEqual([
      { label: "Small", value: 3 },
      { label: "Medium", value: 4 },
    ]);
  });
});

describe("resizeWidth", () => {
  it("sets the width and keeps the origin when it still fits", () => {
    expect(resizeWidth(placement(7, 0, 6, 4), 3)).toEqual(
      placement(7, 0, 3, 4),
    );
  });

  it("nudges the origin left so the widget stays on the grid", () => {
    expect(resizeWidth(placement(10, 2, 6, 4), 12)).toEqual(
      placement(0, 2, 12, 4),
    );
  });
});

describe("resizeHeight", () => {
  it("sets the height and leaves the rest of the placement alone", () => {
    expect(resizeHeight(placement(3, 1, 6, 4), 5)).toEqual(
      placement(3, 1, 6, 5),
    );
  });
});

describe("moveInstance", () => {
  it("swaps origins with the neighbour above, keeping each widget's size", () => {
    const layout = [
      instance("a", placement(0, 0, 12, 5)),
      instance("b", placement(0, 5, 3, 3)),
    ];

    const result = moveInstance(layout, "b", -1);

    expect(result.find((entry) => entry.key === "b")?.grid).toEqual(
      placement(0, 0, 3, 3),
    );
    expect(result.find((entry) => entry.key === "a")?.grid).toEqual(
      placement(0, 5, 12, 5),
    );
  });

  it("swaps with the neighbour below when moving down", () => {
    const layout = [
      instance("a", placement(0, 0, 12, 5)),
      instance("b", placement(0, 5, 3, 3)),
    ];

    const result = moveInstance(layout, "a", 1);

    expect(result.find((entry) => entry.key === "a")?.grid).toEqual(
      placement(0, 5, 12, 5),
    );
    expect(result.find((entry) => entry.key === "b")?.grid).toEqual(
      placement(0, 0, 3, 3),
    );
  });

  it("leaves the layout untouched at the edge of the order", () => {
    const layout = [instance("a", placement(0, 0, 12, 5))];

    expect(moveInstance(layout, "a", -1)).toBe(layout);
    expect(moveInstance(layout, "a", 1)).toBe(layout);
  });

  it("does not mutate the input", () => {
    const layout = [
      instance("a", placement(0, 0, 12, 5)),
      instance("b", placement(0, 5, 3, 3)),
    ];

    moveInstance(layout, "b", -1);

    expect(layout[0].grid).toEqual(placement(0, 0, 12, 5));
    expect(layout[1].grid).toEqual(placement(0, 5, 3, 3));
  });
});

describe("canMoveInstance", () => {
  const layout = [
    instance("a", placement(0, 0, 12, 5)),
    instance("b", placement(0, 5, 3, 3)),
  ];

  it("reports a neighbour in either direction", () => {
    expect(canMoveInstance(layout, "a", 1)).toBe(true);
    expect(canMoveInstance(layout, "b", -1)).toBe(true);
  });

  it("reports no move at the edges of the reading order", () => {
    expect(canMoveInstance(layout, "a", -1)).toBe(false);
    expect(canMoveInstance(layout, "b", 1)).toBe(false);
  });

  it("reports no move for an unknown key", () => {
    expect(canMoveInstance(layout, "ghost", 1)).toBe(false);
  });
});

describe("applyLayoutAction", () => {
  it("resizes the keyed instance to a width stop", () => {
    const layout = [instance("a", placement(4, 0, 6, 4))];

    const result = applyLayoutAction(layout, "a", definition(), {
      type: "width",
      value: 3,
    });

    expect(result[0].grid).toEqual(placement(4, 0, 3, 4));
  });

  it("resizes the keyed instance to a height stop", () => {
    const layout = [instance("a", placement(0, 0, 6, 4))];

    const result = applyLayoutAction(layout, "a", definition(), {
      type: "height",
      value: 5,
    });

    expect(result[0].grid).toEqual(placement(0, 0, 6, 5));
  });

  it("moves the keyed instance with the move action", () => {
    const layout = [
      instance("a", placement(0, 0, 12, 5)),
      instance("b", placement(0, 5, 3, 3)),
    ];

    const result = applyLayoutAction(layout, "b", definition(), {
      type: "move",
      direction: -1,
    });

    expect(result.find((entry) => entry.key === "b")?.grid).toEqual(
      placement(0, 0, 3, 3),
    );
  });

  it("leaves the layout untouched for an unknown key", () => {
    const layout = [instance("a", placement(0, 0, 6, 4))];

    expect(
      applyLayoutAction(layout, "ghost", definition(), {
        type: "width",
        value: 3,
      }),
    ).toBe(layout);
  });
});
