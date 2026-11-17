import type { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import { getSuffix } from "@/puck/utils/get-suffix";
import type { Responsive } from "@/puck/utils/responsive";

import type { NavbarAppearanceProps } from "../types";

/**
 * Cascade order shared with `cascadeViewportValues`: a value authored on a
 * larger viewport is inherited by the smaller ones.
 */
const CASCADE: Breakpoint[] = ["desktop", "tablet", "mobile"];

/**
 * Variable prefix per authored property.
 *
 * These are dedicated to the navigation instead of reusing `--fs-*` and
 * `--rgap-*`: those are reset by `.puck-typo` / `.puck-layout`, which the
 * navbar wrapper does not use.
 */
const VAR_PREFIX: Record<keyof NavbarAppearanceProps, string> = {
  fontSize: "--nav-fs",
  itemSpacing: "--nav-gap",
};

const EMPTY_BREAKPOINTS: Record<Breakpoint, NavbarAppearanceProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

/**
 * Turn the authored navigation style into the responsive CSS custom
 * properties consumed by `puck-base.css`.
 *
 * The shared cascade fills each breakpoint from the ones above it (tablet
 * inherits desktop, mobile inherits tablet). With nothing authored the map is
 * empty, so the stylesheet defaults (14px inline labels, 8px inline row gap,
 * 16px/4px in the sheet) apply and a pre-existing document renders exactly as
 * before. Only values, never an inline `font-size`/`gap`, are emitted, so the
 * media ladder can respond.
 */
export const getNavbarAppearanceVars = (
  appearance?: Responsive<NavbarAppearanceProps>,
): Record<string, string> => {
  const vars: Record<string, string> = {};

  if (!appearance) return vars;

  for (const key of Object.keys(VAR_PREFIX) as Array<
    keyof NavbarAppearanceProps
  >) {
    for (const breakpoint of CASCADE) {
      const resolved = cascadeViewportValues(
        breakpoint,
        appearance,
        EMPTY_BREAKPOINTS,
      );
      const value = resolved[key];

      if (value !== undefined && value.trim() !== "") {
        vars[`${VAR_PREFIX[key]}-${getSuffix(breakpoint)}`] = value;
      }
    }
  }

  return vars;
};
