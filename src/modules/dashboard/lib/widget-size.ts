import type { WidgetSize } from "../types";

/**
 * Grid placement for each discrete widget size. The dashboard grid is a single
 * column on small screens and six columns from `md` up.
 */
export const WIDGET_SIZE_CLASS: Record<WidgetSize, string> = {
  small: "md:col-span-2",
  medium: "md:col-span-3",
  full: "md:col-span-6",
};
