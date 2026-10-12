import type { DashboardWidgetInstance, WidgetConfig } from "@/shared/dashboard/types";

/**
 * Generates the stable key for a user-created instance. The key never changes
 * afterwards, so reordering or reconfiguring an instance keeps its identity.
 */
export const createInstanceKey = (definitionId: string) =>
  `${definitionId}-${crypto.randomUUID()}`;

/**
 * Applies a patch to the instance with the given key. The key never changes, so
 * an edit affects exactly one instance — two instances of the same definition
 * keep their own state. Resizing and reconfiguring both go through this one
 * function.
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
 * Appends a new instance of a definition to the layout, seeded with the
 * definition's default config when it declares one. The X removes an instance
 * outright (there is no hidden state), so a freshly added widget always lands at
 * the end — the position of the library's `+` tile.
 */
export const addInstance = (
  instances: DashboardWidgetInstance[],
  definitionId: string,
  key: string,
  defaultConfig?: WidgetConfig,
): DashboardWidgetInstance[] => [
  ...instances,
  { key, definitionId, ...(defaultConfig ? { config: defaultConfig } : {}) },
];

/** Removes the instance with the given key from the layout. */
export const removeInstance = (
  instances: DashboardWidgetInstance[],
  key: string,
): DashboardWidgetInstance[] =>
  instances.filter((instance) => instance.key !== key);

/**
 * Moves the instance with `fromKey` to the slot currently occupied by `toKey`,
 * preserving every other instance's position. Identities are keys, not indices,
 * so a widget that the grid leaves out (e.g. a Trend with no readable metric)
 * never shifts the mapping between what is dragged and what is persisted.
 */
export const moveInstance = (
  instances: DashboardWidgetInstance[],
  fromKey: string,
  toKey: string,
): DashboardWidgetInstance[] => {
  const from = instances.findIndex((instance) => instance.key === fromKey);
  const to = instances.findIndex((instance) => instance.key === toKey);

  if (from === -1 || to === -1 || from === to) return instances;

  const next = [...instances];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return next;
};
