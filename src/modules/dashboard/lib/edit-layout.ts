import type { DashboardWidgetInstance } from "../types";

/**
 * Generates the stable key for a user-created instance. The key never changes
 * afterwards, so reordering or reconfiguring an instance keeps its identity.
 */
export const createInstanceKey = (definitionId: string) =>
  `${definitionId}-${crypto.randomUUID()}`;

/**
 * Hides the instance with the given key. The instance stays in the layout so it
 * can be re-added from the library; `visibleDashboardWidgets` excludes it from
 * rendering.
 */
export const hideInstance = (
  instances: DashboardWidgetInstance[],
  key: string,
): DashboardWidgetInstance[] =>
  instances.map((instance) =>
    instance.key === key ? { ...instance, hidden: true } : instance,
  );

/**
 * Adds an instance of a definition to the layout. When the layout already holds
 * a hidden instance of that definition, the first one is re-shown instead of
 * appending a duplicate, so hiding a widget is reversible from the library.
 */
export const addInstance = (
  instances: DashboardWidgetInstance[],
  definitionId: string,
  key: string,
): DashboardWidgetInstance[] => {
  const hiddenIndex = instances.findIndex(
    (instance) => instance.definitionId === definitionId && instance.hidden,
  );

  if (hiddenIndex !== -1) {
    return instances.map((instance, index) =>
      index === hiddenIndex ? { ...instance, hidden: false } : instance,
    );
  }

  return [...instances, { key, definitionId }];
};

/**
 * Moves a visible instance between two visible positions. The indices are
 * positions among the rendered (non-hidden) instances, matching what the drag
 * layer reports. Visible instances are permuted across the slots they already
 * occupy, so hidden instances keep their absolute place in the layout.
 */
export const moveInstance = (
  instances: DashboardWidgetInstance[],
  fromVisibleIndex: number,
  toVisibleIndex: number,
): DashboardWidgetInstance[] => {
  const visibleAbsoluteIndices = instances
    .map((instance, index) => ({ instance, index }))
    .filter(({ instance }) => !instance.hidden)
    .map(({ index }) => index);

  if (
    fromVisibleIndex === toVisibleIndex ||
    visibleAbsoluteIndices[fromVisibleIndex] === undefined ||
    visibleAbsoluteIndices[toVisibleIndex] === undefined
  ) {
    return instances;
  }

  const reordered = visibleAbsoluteIndices.map((index) => instances[index]);
  const [moved] = reordered.splice(fromVisibleIndex, 1);
  reordered.splice(toVisibleIndex, 0, moved);

  const next = [...instances];
  visibleAbsoluteIndices.forEach((absoluteIndex, position) => {
    next[absoluteIndex] = reordered[position];
  });

  return next;
};
