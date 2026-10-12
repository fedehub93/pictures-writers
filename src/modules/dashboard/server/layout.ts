import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "../types";

export interface ComputeDashboardLayoutInput {
  /** The user's saved instances. */
  saved: DashboardWidgetInstance[];
  /** The code-defined catalog the instances reference. */
  definitions: WidgetDefinition[];
  /** Whether the current user holds a given area permission. */
  canRead: (permission: string) => boolean;
}

/**
 * Computes the effective Dashboard layout from the user's saved instances.
 *
 * There is no registry default: a user who has saved nothing has an empty
 * dashboard. The saved instances are filtered to those whose definition exists
 * and is still permitted, in the order the user arranged them. Hidden instances
 * are retained in the result so they can be re-added; call
 * {@link visibleDashboardWidgets} to get what should actually render.
 */
export function computeDashboardLayout({
  saved,
  definitions,
  canRead,
}: ComputeDashboardLayoutInput): DashboardWidgetInstance[] {
  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  const isPermitted = (instance: DashboardWidgetInstance) => {
    const definition = definitionById.get(instance.definitionId);
    if (!definition) return false;
    if (!definition.permission) return true;
    return canRead(definition.permission);
  };

  return saved.filter(isPermitted);
}

/** The subset of a layout that should be rendered (not hidden). */
export function visibleDashboardWidgets(
  layout: DashboardWidgetInstance[],
): DashboardWidgetInstance[] {
  return layout.filter((instance) => !instance.hidden);
}
