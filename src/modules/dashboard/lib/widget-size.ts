import type {
  DashboardWidgetInstance,
  WidgetDefinition,
  WidgetSize,
} from "@/shared/dashboard/types";

/**
 * Grid placement for each discrete widget size. The dashboard grid is a single
 * column on small screens and six columns from `md` up.
 */
export const WIDGET_SIZE_CLASS: Record<WidgetSize, string> = {
  small: "md:col-span-2",
  medium: "md:col-span-3",
  full: "md:col-span-6",
};

/** Human labels for the size control. */
export const WIDGET_SIZE_LABEL: Record<WidgetSize, string> = {
  small: "Small",
  medium: "Medium",
  full: "Full",
};

/**
 * The size an instance actually renders at: its own override when it has one,
 * otherwise the definition's default. Keeping the override optional means a
 * saved layout tracks a changed default until the user resizes that instance.
 */
export const resolveWidgetSize = (
  instance: DashboardWidgetInstance,
  definition: WidgetDefinition,
): WidgetSize => instance.size ?? definition.defaultSize;

/** The grid column span of an instance at its effective size. */
export const widgetSizeClass = (
  instance: DashboardWidgetInstance,
  definition: WidgetDefinition,
): string => WIDGET_SIZE_CLASS[resolveWidgetSize(instance, definition)];
