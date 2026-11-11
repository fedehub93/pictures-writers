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

  it("lets an explicit auto keyword cancel an inherited width", () => {
    const vars = getDimensionVars({
      desktop: { maxWidth: "72rem" },
      tablet: { width: "auto" },
    });

    expect(vars["--w-d"]).toBe("100%");
    expect(vars["--w-t"]).toBe("auto");
    expect(vars["--mw-d"]).toBe("72rem");
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

/**
 * Block base width.
 *
 * A Link's root is the anchor, so `width: auto` stretches once it is a flex or
 * grid item. The block declares a natural width instead of changing stored
 * documents: the base is emitted on the desktop rung so the ladder inherits it,
 * and an authored width always outranks it.
 */
describe("getDimensionVars block base width", () => {
  // Deliberately different from the authored values below, so "authored wins"
  // cannot pass by coincidence. The formatter must pass any value through.
  const base = { baseWidth: "10rem" };

  it("emits the base width on the desktop rung when nothing is authored", () => {
    expect(getDimensionVars(undefined, base)).toEqual({ "--w-d": "10rem" });
    expect(getDimensionVars({ desktop: {} }, base)).toEqual({ "--w-d": "10rem" });
  });

  it("passes the declared value through unchanged", () => {
    expect(getDimensionVars(undefined, { baseWidth: "fit-content" })).toEqual({
      "--w-d": "fit-content",
    });
  });

  it("hugs the cap instead of filling when the block authors only a max width", () => {
    const vars = getDimensionVars({ desktop: { maxWidth: "30rem" } }, base);

    // A natural width needs no implied fill: without it the box would stop
    // hugging the cap and turn into a full-width bar.
    expect(vars).toEqual({ "--w-d": "10rem", "--mw-d": "30rem" });
  });

  it.each(["12rem", "50%", "fit-content"])(
    "lets an authored %s win over the block base at the same breakpoint",
    (width) => {
      const vars = getDimensionVars({ desktop: { width } }, base);

      expect(vars).toEqual({ "--w-d": width });
    },
  );

  it("lets an authored width win below the breakpoint that carries the base", () => {
    const vars = getDimensionVars({ tablet: { width: "20rem" } }, base);

    // Tablet overrides the inherited desktop base; mobile falls back to the
    // tablet value and then to desktop, exactly like any other responsive prop.
    expect(vars).toEqual({ "--w-d": "10rem", "--w-t": "20rem" });
  });

  it("lets an explicit auto cancel the block base at a wider breakpoint", () => {
    const vars = getDimensionVars({ desktop: { width: "auto" } }, base);

    expect(vars).toEqual({ "--w-d": "auto" });
  });

  it("lets an explicit auto below the base breakpoint override it", () => {
    const vars = getDimensionVars({ tablet: { width: "auto" } }, base);

    expect(vars["--w-d"]).toBe("10rem");
    expect(vars["--w-t"]).toBe("auto");
  });

  it("emits exactly today's variables for a block without a base width", () => {
    const cases = [
      { desktop: { maxWidth: "72rem" } },
      { desktop: { height: "10rem" } },
      { desktop: { width: "50%" }, tablet: { maxWidth: "40rem" } },
    ];

    for (const data of cases) {
      expect(getDimensionVars(data, { baseWidth: undefined })).toEqual(
        getDimensionVars(data),
      );
    }

    expect(getDimensionVars({ desktop: { maxWidth: "72rem" } })).toEqual({
      "--mw-d": "72rem",
      "--w-d": "100%",
    });
  });
});
