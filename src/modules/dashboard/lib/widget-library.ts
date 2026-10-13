import {
  isAnalyticsWidget,
  type WidgetDefinition,
} from "@/shared/dashboard/types";

/**
 * Filters the code-defined catalog down to the definitions a user may add from
 * the widget library: the permitted definitions, minus the analytics widgets
 * (the Trend) when the user can read no Metric — a Trend with nothing to render
 * is not worth offering. The same rules that gate a widget's card gate its
 * library entry, so the library never offers what the dashboard would drop.
 */
export const permittedLibraryDefinitions = (
  definitions: WidgetDefinition[],
  canRead: (permission: string) => boolean,
  metricCount: number,
): WidgetDefinition[] =>
  definitions.filter((definition) => {
    if (definition.permission && !canRead(definition.permission)) return false;
    if (isAnalyticsWidget(definition) && metricCount === 0) return false;
    return true;
  });
