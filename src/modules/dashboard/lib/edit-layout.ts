import type {
  DashboardWidgetInstance,
  WidgetConfig,
  WidgetDefinition,
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
