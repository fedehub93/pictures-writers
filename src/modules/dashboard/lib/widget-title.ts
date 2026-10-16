import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";

/**
 * The title a widget card shows, in precedence order: the user's per-instance
 * override, the definition's config-derived default (the Trend names itself
 * after its metric), the definition's static title. Each candidate is trimmed,
 * so a title of only whitespace is treated as absent and falls through.
 */
export const resolveWidgetTitle = (
  definition: WidgetDefinition,
  instance: DashboardWidgetInstance,
  context: WidgetConfigContext,
): string => {
  const override = instance.title?.trim();
  if (override) return override;

  const derived = definition
    .resolveTitle?.(context, instance.config ?? null)
    ?.trim();
  if (derived) return derived;

  return definition.title;
};
