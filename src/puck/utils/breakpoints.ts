export type Breakpoint = "mobile" | "tablet" | "desktop";

/**
 * The single source of truth for the responsive ladder.
 *
 * Authoring buckets, the CSS media queries in `puck-base.css` and the Tailwind
 * classes used by responsive blocks all resolve to these numbers:
 *
 * - mobile: 0–767
 * - tablet: 768–1023
 * - desktop: 1024+
 *
 * `src/puck/__tests__/breakpoints.test.ts` fails if the stylesheet or the
 * viewport selector drift from this table.
 */
export const BREAKPOINTS = {
  mobile: {
    id: "mobile",
    label: "Mobile",
    minWidth: 0,
    maxWidth: 767,
    puckCanvasWidth: 360,
  },
  tablet: {
    id: "tablet",
    label: "Tablet",
    minWidth: 768,
    maxWidth: 1023,
    puckCanvasWidth: 768,
  },
  desktop: {
    id: "desktop",
    label: "Desktop",
    minWidth: 1024,
    maxWidth: null,
    puckCanvasWidth: 1280,
  },
} as const;

export const BREAKPOINTS_IN_ORDER: Breakpoint[] = [
  "mobile",
  "tablet",
  "desktop",
];

/** Map a CSS pixel width to the bucket it belongs to. */
export const getBreakpointForWidth = (width: number): Breakpoint => {
  if (width <= BREAKPOINTS.mobile.maxWidth) return "mobile";
  if (width <= BREAKPOINTS.tablet.maxWidth) return "tablet";
  return "desktop";
};
