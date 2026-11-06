import type { Breakpoint } from "@/puck/utils/breakpoints";
import { getSuffix } from "@/puck/utils/get-suffix";
import type { Responsive } from "@/puck/utils/responsive";

import type { LayoutProps } from "./index";

const BREAKPOINT_ORDER: Breakpoint[] = ["desktop", "tablet", "mobile"];

export type LayoutClassOptions = {
  /**
   * The editor canvas keeps a block hidden at the selected viewport visible,
   * so it can still be selected and edited. In that mode the classes describe
   * both the authored display rule and the editor-only placeholder.
   */
  editing?: boolean;
};

const authoredDisplayClasses = (
  layout: Responsive<LayoutProps>,
): string => {
  const authored = BREAKPOINT_ORDER.filter(
    (breakpoint) => layout[breakpoint]?.display !== undefined,
  );

  if (authored.length === 0) return "";

  return [
    "puck-display",
    ...authored.map((breakpoint) => `puck-display-${getSuffix(breakpoint)}`),
  ].join(" ");
};

/**
 * Class names for the responsive display rule of a block.
 *
 * The public path emits a display class only for breakpoints that carry an
 * authored `display` value: a block with an empty layout (or a layout that only
 * carries container/flex settings) must keep its current markup and must not
 * resolve `display: var(--disp-d)` to `inline`.
 *
 * The editor path keeps the same classes so visible breakpoints still match the
 * public layout, and adds `puck-hidden-at-*` markers for every breakpoint where
 * the cascade hides the block. `puck-base.css` uses those markers, together
 * with the viewport selected in the toolbar, to draw an editor-only placeholder
 * instead of letting `display: none` make the block unselectable.
 */
export const getLayoutClassNames = (
  layout: Responsive<LayoutProps> | undefined,
  { editing = false }: LayoutClassOptions = {},
): string => {
  if (!layout) return "";

  const displayClasses = authoredDisplayClasses(layout);

  if (!editing) return displayClasses;

  const displayAt = (breakpoint: Breakpoint) => layout[breakpoint]?.display;
  const desktop = displayAt("desktop");
  const tablet = displayAt("tablet") ?? desktop;
  const mobile = displayAt("mobile") ?? tablet;

  const hiddenClasses: string[] = [];

  if (desktop === "none") hiddenClasses.push("puck-hidden-at-desktop");
  if (tablet === "none") hiddenClasses.push("puck-hidden-at-tablet");
  if (mobile === "none") hiddenClasses.push("puck-hidden-at-mobile");

  if (hiddenClasses.length === 0) return displayClasses;

  return [
    displayClasses,
    "puck-hidden-placeholder",
    ...hiddenClasses,
  ]
    .filter(Boolean)
    .join(" ");
};
