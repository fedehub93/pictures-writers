import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { BREAKPOINTS, getBreakpointForWidth } from "../utils/breakpoints";

const stylesheet = readFileSync(
  new URL("../styles/puck-base.css", import.meta.url),
  "utf8",
);

describe("responsive ladder", () => {
  it("maps widths to the documented buckets at the exact boundaries", () => {
    expect(getBreakpointForWidth(0)).toBe("mobile");
    expect(getBreakpointForWidth(BREAKPOINTS.mobile.maxWidth)).toBe("mobile");
    expect(getBreakpointForWidth(BREAKPOINTS.tablet.minWidth)).toBe("tablet");
    expect(getBreakpointForWidth(BREAKPOINTS.tablet.maxWidth)).toBe("tablet");
    expect(getBreakpointForWidth(BREAKPOINTS.desktop.minWidth)).toBe("desktop");
    expect(getBreakpointForWidth(1440)).toBe("desktop");
  });

  it("keeps the buckets contiguous", () => {
    expect(BREAKPOINTS.tablet.minWidth).toBe(BREAKPOINTS.mobile.maxWidth + 1);
    expect(BREAKPOINTS.desktop.minWidth).toBe(BREAKPOINTS.tablet.maxWidth + 1);
  });

  it("keeps every editor canvas inside its own bucket", () => {
    for (const breakpoint of ["mobile", "tablet", "desktop"] as const) {
      expect(getBreakpointForWidth(BREAKPOINTS[breakpoint].puckCanvasWidth)).toBe(
        breakpoint,
      );
    }
  });

  it("uses the same boundaries in puck-base.css", () => {
    expect(stylesheet).toContain(
      `@media (max-width: ${BREAKPOINTS.mobile.maxWidth}px)`,
    );
    expect(stylesheet).toContain(
      `@media (max-width: ${BREAKPOINTS.tablet.maxWidth}px)`,
    );
    expect(stylesheet).toContain(
      `@media (min-width: ${BREAKPOINTS.tablet.minWidth}px) and (max-width: ${BREAKPOINTS.tablet.maxWidth}px)`,
    );
    expect(stylesheet).toContain(
      `@media (min-width: ${BREAKPOINTS.desktop.minWidth}px)`,
    );
    // The old tablet upper bound overlapped Tailwind's `lg` (1024px).
    expect(stylesheet).not.toContain("max-width: 1024px");
  });
});
