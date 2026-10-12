import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "../types";

export interface ComputeDashboardLayoutInput {
  /** The registry's default instances, in their declared order. */
  defaults: DashboardWidgetInstance[];
  /** The user's saved instances (sparse override). */
  saved: DashboardWidgetInstance[];
  /** The code-defined catalog the instances reference. */
  definitions: WidgetDefinition[];
  /** Whether the current user holds a given area permission. */
  canRead: (permission: string) => boolean;
}

/**
 * Computes the effective Dashboard layout from the registry defaults and the
 * user's sparse override.
 *
 * 1. Defaults are kept only when their definition exists and is permitted.
 * 2. Saved instances set the relative order; their `hidden`/`config` win.
 * 3. Defaults absent from the saved document are appended (so new registry
 *    defaults appear automatically).
 * 4. Saved instances whose definition is gone or no longer permitted are
 *    dropped.
 *
 * Hidden instances are retained in the result so they can be re-added; call
 * {@link visibleDashboardWidgets} to get what should actually render.
 */
export function computeDashboardLayout({
  defaults,
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

  const savedPermitted = saved.filter(isPermitted);
  const savedKeys = new Set(savedPermitted.map((instance) => instance.key));

  const appendedDefaults = defaults.filter(
    (instance) => isPermitted(instance) && !savedKeys.has(instance.key),
  );

  return [...savedPermitted, ...appendedDefaults];
}

/** The subset of a layout that should be rendered (not hidden). */
export function visibleDashboardWidgets(
  layout: DashboardWidgetInstance[],
): DashboardWidgetInstance[] {
  return layout.filter((instance) => !instance.hidden);
}
