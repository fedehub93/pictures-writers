import type { WidgetGridPlacement } from "@/shared/dashboard/types";

/**
 * A spoken description of a widget's placement: its size and its position in
 * the grid, with the column and row one-based because a screen reader should
 * not hear "column 0, row 0".
 */
export const describePlacement = (placement: WidgetGridPlacement): string =>
  `${placement.w} columns by ${placement.h} rows at column ${placement.x + 1}, row ${placement.y + 1}`;

/**
 * The live-region message for a widget that moved or resized: its effective
 * title, then its new position and size.
 */
export const layoutChangeAnnouncement = (
  title: string,
  placement: WidgetGridPlacement,
): string => `${title}: ${describePlacement(placement)}.`;
