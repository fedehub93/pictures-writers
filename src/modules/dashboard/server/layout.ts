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
 * A persisted instance, plus the `hidden` flag older layouts could carry. The X
 * used to hide an instance; it now removes it, so a legacy hidden entry is
 * discarded on read rather than resurrected as a visible widget.
 */
type PersistedInstance = DashboardWidgetInstance & { hidden?: boolean };

/**
 * Computes the effective Dashboard layout from the user's saved instances.
 *
 * There is no registry default: a user who has saved nothing has an empty
 * dashboard. The saved instances are filtered to those whose definition exists
 * and is still permitted, in the order the user arranged them. Legacy `hidden`
 * entries are dropped.
 */
export function computeDashboardLayout({
  saved,
  definitions,
  canRead,
}: ComputeDashboardLayoutInput): DashboardWidgetInstance[] {
  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  const isPermitted = (instance: PersistedInstance) => {
    if (instance.hidden) return false;
    const definition = definitionById.get(instance.definitionId);
    if (!definition) return false;
    if (!definition.permission) return true;
    return canRead(definition.permission);
  };

  return (saved as PersistedInstance[]).filter(isPermitted);
}
