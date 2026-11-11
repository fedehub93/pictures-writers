import { describe, expect, it } from "vitest";

import { getDimensionVars } from "../utils/get-style-vars";

/**
 * Width intent.
 *
 * A box that caps its own width and centres itself with auto margins is a
 * content area, not a shrink-to-fit label. With no authored width, `max-width`
 * alone lets the box collapse inside a flex parent on the published page while
 * the canvas wrapper made it fill. `getDimensionVars` is the single function
 * both render paths call, so the rule lives here.
 */
describe("getDimensionVars width intent", () => {
  it("implies a full width when a breakpoint authors max-width and no width", () => {
    const vars = getDimensionVars({ desktop: { maxWidth: "72rem" } });

    expect(vars).toEqual({ "--mw-d": "72rem", "--w-d": "100%" });
  });

  it("keeps the authored width when max-width is also present", () => {
    const vars = getDimensionVars({
      desktop: { width: "50rem", maxWidth: "72rem" },
    });

    expect(vars["--w-d"]).toBe("50rem");
    expect(vars["--mw-d"]).toBe("72rem");
  });

  it("emits no width when neither width nor max-width is authored", () => {
    const vars = getDimensionVars({ desktop: { height: "10rem" } });

    expect(vars).toEqual({ "--h-d": "10rem" });
    expect(vars).not.toHaveProperty("--w-d");
  });

  it("emits no max-width when only a width is authored", () => {
    const vars = getDimensionVars({ desktop: { width: "fit-content" } });

    expect(vars).toEqual({ "--w-d": "fit-content" });
    expect(vars).not.toHaveProperty("--mw-d");
  });

  it("keeps fit-content as an authored width instead of turning it into a fill", () => {
    const vars = getDimensionVars({
      desktop: { width: "fit-content", maxWidth: "30rem" },
    });

    expect(vars["--w-d"]).toBe("fit-content");
  });

  it("treats a stored auto keyword like an unset width", () => {
    const vars = getDimensionVars({
      desktop: { width: " auto ", maxWidth: "72rem" },
    });

    expect(vars).toEqual({ "--mw-d": "72rem", "--w-d": "100%" });
  });

  it("emits the implied fill only at the breakpoint that authors the max-width", () => {
    const vars = getDimensionVars({
      desktop: { height: "10rem" },
      tablet: { maxWidth: "40rem" },
    });

    expect(vars["--w-t"]).toBe("100%");
    expect(vars["--mw-t"]).toBe("40rem");
    // Desktop resolves `auto`, and mobile inherits the tablet fill.
    expect(vars).not.toHaveProperty("--w-d");
    expect(vars).not.toHaveProperty("--w-m");
  });

  it("keeps a wider authored width instead of replacing it with the implied fill", () => {
    const vars = getDimensionVars({
      desktop: { width: "50%" },
      tablet: { maxWidth: "40rem" },
    });

    // Tablet inherits the desktop width, so the cap applies to the authored
    // 50% rather than silently turning the box into a full-width one.
    expect(vars["--w-d"]).toBe("50%");
    expect(vars["--w-t"]).toBeUndefined();
    expect(vars["--mw-t"]).toBe("40rem");
  });

  it("keeps an authored width below the breakpoint that implies a fill", () => {
    const vars = getDimensionVars({
      desktop: { maxWidth: "72rem" },
      mobile: { width: "fit-content" },
    });

    expect(vars["--w-d"]).toBe("100%");
    expect(vars["--w-m"]).toBe("fit-content");
  });

  it("returns no variables for a missing value", () => {
    expect(getDimensionVars()).toEqual({});
    expect(getDimensionVars({ desktop: {} })).toEqual({});
  });
});
