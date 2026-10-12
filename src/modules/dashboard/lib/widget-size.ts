import type {
  DashboardWidgetInstance,
  WidgetDefinition,
  WidgetSize,
} from "@/shared/dashboard/types";

/** The dashboard grid's column count from `md` up (single column below). */
export const GRID_COLUMNS = 6;

/**
 * The grid columns each discrete size occupies, out of `GRID_COLUMNS`. The
 * size is a weight, not a guarantee: the row packer may stretch the last item
 * of a partial row to fill it.
 */
export const WIDGET_SIZE_UNITS: Record<WidgetSize, number> = {
  small: 2,
  medium: 3,
  full: 6,
};

/** Human labels for the size control. */
export const WIDGET_SIZE_LABEL: Record<WidgetSize, string> = {
  small: "Small",
  medium: "Medium",
  full: "Full",
};

/**
 * The `md:col-span-N` class for a column count. Literal strings (not
 * template-built) so Tailwind keeps the classes in its build.
 */
const MD_COL_SPAN: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
};

/** The `md:col-span-N` class for a resolved column count. */
export const mdColSpan = (units: number): string =>
  MD_COL_SPAN[units] ?? MD_COL_SPAN[GRID_COLUMNS];

/**
 * The size an instance actually renders at: its own override when it has one,
 * otherwise the definition's default. Keeping the override optional means a
 * saved layout tracks a changed default until the user resizes that instance.
 */
export const resolveWidgetSize = (
  instance: DashboardWidgetInstance,
  definition: WidgetDefinition,
): WidgetSize => instance.size ?? definition.defaultSize;

/** The grid columns an instance's effective size asks for. */
export const widgetSizeUnits = (
  instance: DashboardWidgetInstance,
  definition: WidgetDefinition,
): number => WIDGET_SIZE_UNITS[resolveWidgetSize(instance, definition)];
