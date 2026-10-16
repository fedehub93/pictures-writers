import type {
  DashboardWidgetInstance,
  WidgetConfig,
  WidgetDefinition,
  WidgetGridPlacement,
} from "@/shared/dashboard/types";

import { seedPlacement } from "./grid-layout";

/**
 * Generates the stable key for a user-created instance. The key never changes
 * afterwards, so moving, resizing, or reconfiguring an instance keeps its
 * identity.
 */
export const createInstanceKey = (definitionId: string) =>
  `${definitionId}-${crypto.randomUUID()}`;

/**
 * Applies a patch to the instance with the given key. The key never changes, so
 * an edit affects exactly one instance — two instances of the same definition
 * keep their own state. Renaming, reconfiguring, and re-placing all go through
 * this one function.
 */
export const updateInstance = (
  instances: DashboardWidgetInstance[],
  key: string,
  patch: Partial<DashboardWidgetInstance>,
): DashboardWidgetInstance[] =>
  instances.map((instance) =>
    instance.key === key ? { ...instance, ...patch } : instance,
  );

/** A grid item's placement, keyed by the instance key it belongs to. */
export interface GridPlacementItem extends WidgetGridPlacement {
  i: string;
}

/**
 * Applies a grid's reported arrangement to the instances it holds. A drag can
 * move the dragged widget and, through vertical compaction, the widgets around
 * it, so the whole layout is read back at once: every instance present on the
 * grid takes the item's placement, and an instance the grid does not hold (a
 * widget filtered out of the render) keeps its stored placement. Instances
 * whose placement is unchanged keep their identity, so a save that moved one
 * widget does not re-render the rest.
 */
export const applyGridLayout = (
  instances: DashboardWidgetInstance[],
  items: readonly GridPlacementItem[],
): DashboardWidgetInstance[] => {
  if (items.length === 0) return instances;

  const byKey = new Map(items.map((item) => [item.i, item]));

  return instances.map((instance) => {
    const item = byKey.get(instance.key);
    if (!item) return instance;

    const { x, y, w, h } = item;
    if (
      x === instance.grid.x &&
      y === instance.grid.y &&
      w === instance.grid.w &&
      h === instance.grid.h
    ) {
      return instance;
    }

    return { ...instance, grid: { x, y, w, h } };
  });
};

/**
 * Appends a new instance of a definition to the layout, placed in the first
 * free slot for its preset span and seeded with the definition's default config
 * when it declares one. The X removes an instance outright (there is no hidden
 * state).
 */
export const addInstance = (
  instances: DashboardWidgetInstance[],
  definition: WidgetDefinition,
  key: string,
  defaultConfig?: WidgetConfig,
): DashboardWidgetInstance[] => [
  ...instances,
  {
    key,
    definitionId: definition.id,
    grid: seedPlacement(
      definition,
      instances.map((instance) => instance.grid),
    ),
    ...(defaultConfig ? { config: defaultConfig } : {}),
  },
];

/** Removes the instance with the given key from the layout. */
export const removeInstance = (
  instances: DashboardWidgetInstance[],
  key: string,
): DashboardWidgetInstance[] =>
  instances.filter((instance) => instance.key !== key);
