import type {
  DashboardWidgetInstance,
  WidgetDefinition,
  WidgetGridPlacement,
} from "@/shared/dashboard/types";
import { WIDGET_SIZES } from "@/shared/dashboard/types";

import { updateInstance } from "./edit-layout";
import {
  clamp,
  GRID_COLUMNS,
  resolveWidgetLayout,
  sortForSingleColumn,
  WIDGET_SIZE_LABEL,
  WIDGET_SIZE_PRESETS,
  type ResolvedWidgetBounds,
} from "./grid-layout";

/**
 * One stop the keyboard layout control can move a widget's width or height to:
 * the grid extent and the size-preset label it shows.
 */
export interface LayoutStop {
  label: string;
  value: number;
}

/**
 * The width or height stops a definition's bounds allow, ascending and without
 * duplicates. Each stop is a size preset's seed extent clamped into the
 * definition's own floor and ceiling, so a preset the bounds have squeezed
 * together collapses to one stop instead of repeating.
 */
const stopsFor = (
  axis: "w" | "h",
  bounds: ResolvedWidgetBounds,
): LayoutStop[] => {
  const min = axis === "w" ? bounds.minW : bounds.minH;
  const max =
    axis === "w" ? bounds.maxW : (bounds.maxH ?? Number.POSITIVE_INFINITY);

  const seen = new Set<number>();

  return WIDGET_SIZES.flatMap((size) => {
    const value = Math.min(
      Math.max(WIDGET_SIZE_PRESETS[size].seed[axis], min),
      max,
    );
    if (seen.has(value)) return [];
    seen.add(value);
    return [{ label: WIDGET_SIZE_LABEL[size], value }];
  }).sort((a, b) => a.value - b.value);
};

/** The width stops a widget's keyboard resize steps through, within its bounds. */
export const widthStops = (bounds: ResolvedWidgetBounds): LayoutStop[] =>
  stopsFor("w", bounds);

/** The height stops a widget's keyboard resize steps through, within its bounds. */
export const heightStops = (bounds: ResolvedWidgetBounds): LayoutStop[] =>
  stopsFor("h", bounds);

/**
 * Resizes a placement to a width stop. The origin is nudged left when the wider
 * span would otherwise overhang the grid, so the widget always stays on it.
 */
export const resizeWidth = (
  placement: WidgetGridPlacement,
  width: number,
): WidgetGridPlacement => ({
  ...placement,
  w: width,
  x: Math.min(Math.max(placement.x, 0), Math.max(0, GRID_COLUMNS - width)),
});

/** Resizes a placement to a height stop, leaving the rest of it alone. */
export const resizeHeight = (
  placement: WidgetGridPlacement,
  height: number,
): WidgetGridPlacement => ({ ...placement, h: height });

/**
 * Whether an instance has a neighbour one step up or down the dashboard's
 * reading order, so a move in that direction would do something.
 */
export const canMoveInstance = (
  instances: DashboardWidgetInstance[],
  key: string,
  direction: -1 | 1,
): boolean => {
  const index = sortForSingleColumn(instances).findIndex(
    (instance) => instance.key === key,
  );
  const target = index + direction;

  return index !== -1 && target >= 0 && target < instances.length;
};

/**
 * Moves an instance one step up or down the dashboard's reading order (row,
 * then column) by swapping origins with its neighbour while each widget keeps
 * its own size, so a move never changes how large a widget is. At the edge of
 * the order the layout is returned untouched.
 */
export const moveInstance = (
  instances: DashboardWidgetInstance[],
  key: string,
  direction: -1 | 1,
): DashboardWidgetInstance[] => {
  const ordered = sortForSingleColumn(instances);
  const index = ordered.findIndex((instance) => instance.key === key);
  const target = ordered[index];
  const neighbour = ordered[index + direction];

  if (!target || !neighbour) return instances;

  return updateInstance(
    updateInstance(instances, target.key, {
      grid: { ...target.grid, x: neighbour.grid.x, y: neighbour.grid.y },
    }),
    neighbour.key,
    { grid: { ...neighbour.grid, x: target.grid.x, y: target.grid.y } },
  );
};

/**
 * The keyboard layout actions a widget exposes in edit mode. A width or height
 * action carries the chosen stop; a move action carries the direction.
 */
export type LayoutAction =
  | { type: "width"; value: number }
  | { type: "height"; value: number }
  | { type: "move"; direction: -1 | 1 };

/**
 * Applies a keyboard layout action to one instance. Resizes snap to the chosen
 * stop; a move swaps the widget with its neighbour in the reading order. The
 * definition supplies the bounds a resize respects, so a keyboard resize never
 * leaves the legibility floor or ceiling. An unknown key leaves the layout
 * untouched.
 */
export const applyLayoutAction = (
  instances: DashboardWidgetInstance[],
  key: string,
  definition: WidgetDefinition,
  action: LayoutAction,
): DashboardWidgetInstance[] => {
  if (action.type === "move") {
    return moveInstance(instances, key, action.direction);
  }

  const instance = instances.find((entry) => entry.key === key);
  if (!instance) return instances;

  const { bounds } = resolveWidgetLayout(definition);
  const grid =
    action.type === "width"
      ? resizeWidth(
          instance.grid,
          clamp(action.value, bounds.minW, bounds.maxW),
        )
      : resizeHeight(
          instance.grid,
          clamp(
            action.value,
            bounds.minH,
            bounds.maxH ?? Number.POSITIVE_INFINITY,
          ),
        );

  return updateInstance(instances, key, { grid });
};
