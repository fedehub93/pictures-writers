import type {
  DashboardWidgetInstance,
  WidgetDefinition,
} from "@/shared/dashboard/types";

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
 * and is still permitted, preserving each instance's placement. There is no
 * migration and no legacy hidden state: a saved instance is either permitted
 * and rendered, or dropped.
 */
export function computeDashboardLayout({
  saved,
  definitions,
  canRead,
}: ComputeDashboardLayoutInput): DashboardWidgetInstance[] {
  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  return saved.filter((instance) => {
    const definition = definitionById.get(instance.definitionId);
    if (!definition) return false;
    if (!definition.permission) return true;
    return canRead(definition.permission);
  });
}
