import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { LinkProps } from "../fields/link/types";
import type { DecorationProps } from "../fields/decoration";
import type { Responsive } from "../utils/responsive";
import type { ButtonContentProps, ButtonVariant } from "../blocks/Button/types";

import { ButtonBlock } from "../blocks/Button";
import { renderButtonBlock } from "../blocks/Button/render";
import { ButtonBlockUi } from "../blocks/Button/ui/button";
import { BREAKPOINTS } from "../utils/breakpoints";
import {
  HOVER_STATE,
  getDecorationStateVars,
} from "../utils/get-style-vars";

import { declarations, readPuckBaseRules, type Rule } from "./helpers/css-rules";

/**
 * Hover is read, not authored.
 *
 * Two seams carry it: the variant's class declares the state's own Style
 * variables (`--bgc-h-d`) where the variant dictates a hover, and one
 * stylesheet rule reads them with a colour derived from the base background
 * where no variant value exists. Neither the render nor the state writes a
 * base variable, because an authored value is inline and no stylesheet rule
 * could outrank it (ADR-0043, ADR-0045).
 */

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

const LINK: LinkProps = {
  type: "external",
  url: "https://example.com/",
  label: "Example",
};

/** The block root is the anchor (or the plain-text span), so its tag is the contract. */
function rootTag(html: string) {
  return html.slice(0, html.indexOf(">") + 1);
}

function renderRoot(
  button: ButtonContentProps,
  decoration?: Responsive<DecorationProps>,
) {
  return rootTag(
    renderToStaticMarkup(
      renderButtonBlock({ id: "button", button, decoration, puck: PUCK }),
    ),
  );
}

function renderUi(button?: ButtonContentProps) {
  return rootTag(
    renderToStaticMarkup(<ButtonBlockUi button={button} styleVars={{}} />),
  );
}

const rules = readPuckBaseRules();

const HOVER_SELECTOR = ".puck-button:hover";
/** On the page the state belongs to a control, so an anchor carries it. */
const PAGE_SELECTOR = `a${HOVER_SELECTOR}`;
/** In the canvas the same Button may be text, so Puck's marker previews it. */
const CANVAS_SELECTOR = `[data-puck-component]${HOVER_SELECTOR}`;

// The media queries come from the one breakpoint table, not a third copy of
// its numbers.
const TABLET_MEDIA = `@media (max-width: ${BREAKPOINTS.tablet.maxWidth}px)`;
const MOBILE_MEDIA = `@media (max-width: ${BREAKPOINTS.mobile.maxWidth}px)`;

function selectorsOf(rule: Rule) {
  return rule.selector.split(",").map((part) => part.trim());
}

/** Splits a CSS value at the commas that are not inside a function. */
function splitTopLevel(value: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    else if (value[index] === ")") depth -= 1;
    else if (value[index] === "," && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(value.slice(start));
  return parts;
}

function matchingParen(value: string, openIndex: number) {
  let depth = 0;

  for (let index = openIndex; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    if (value[index] === ")" && --depth === 0) return index;
  }

  throw new Error(`Unbalanced parentheses in "${value}"`);
}

/** A `var()` chain's rungs, outermost first, and the value at the bottom. */
type VarChain = { names: string[]; tail: string };

/**
 * Reads a `var()` fallback chain, outermost first.
 *
 * A `var()` takes one fallback, so a state ladder is nested:
 * `var(--a, var(--b, value))`. The shape that shipped — `var(--a, var(--b),
 * value)` — is a different value: the fallback is the comma-separated list
 * `var(--b), value`, two values for one property, invalid at computed-value
 * time. A substring assertion cannot tell the two apart; this can.
 */
function varChain(value: string): VarChain {
  const declaration = value.replace(/!important\s*$/, "").trim();

  const read = (node: string): VarChain => {
    if (!node.startsWith("var(")) {
      if (splitTopLevel(node).length > 1) {
        throw new Error(
          `"${declaration}" puts a comma-separated list where one value belongs`,
        );
      }

      return { names: [], tail: node };
    }

    const close = matchingParen(node, 3);
    if (close !== node.length - 1) {
      throw new Error(`"${declaration}" has tokens after its var() chain`);
    }

    const args = splitTopLevel(node.slice(4, close));
    if (args.length !== 2) {
      throw new Error(
        `"${declaration}" passes ${args.length - 1} values to one var(); each fallback must nest in its own var()`,
      );
    }

    const inner = read(args[1].trim());
    return { names: [args[0].trim(), ...inner.names], tail: inner.tail };
  };

  return read(declaration);
}

function rulesFor(selector: string, media: string | null) {
  return rules.filter(
    (candidate) =>
      candidate.media === media && selectorsOf(candidate).includes(selector),
  );
}

function hoverRule(media: string | null): Rule {
  const [rule] = rules.filter(
    (candidate) =>
      candidate.media === media &&
      candidate.selector.includes(HOVER_SELECTOR),
  );

  if (!rule) {
    throw new Error(
      `${HOVER_SELECTOR} has no rule in puck-base.css (media: ${media ?? "none"})`,
    );
  }

  return rule;
}

describe("Button hover stylesheet", () => {
  it("puts every hover rule on the block's own selector", () => {
    const hoverRules = rules.filter((rule) =>
      rule.selector.includes(HOVER_SELECTOR),
    );

    // One rule per rung: the desktop one plus the tablet and mobile overrides.
    expect(hoverRules).toHaveLength(3);

    for (const rule of hoverRules) {
      // The page state is a control's, the canvas one is a preview.
      expect(selectorsOf(rule)).toEqual([PAGE_SELECTOR, CANVAS_SELECTOR]);
    }
  });

  it("derives the desktop hover from the base background", () => {
    const value = declarations(hoverRule(null)).get("background-color");

    expect(value).toBeDefined();
    expect(value).toContain("--bgc-h-d");
    expect(value).toContain("color-mix(");
    expect(value).toContain("var(--bgc-d)");
    expect(value).toContain("var(--foreground)");
    // `.puck-deco` declares the base background with `!important`.
    expect(value).toContain("!important");
  });

  it("reads the state's variable ahead of the derived colour as a nested chain at every rung", () => {
    const chainAt = (media: string | null) =>
      varChain(declarations(hoverRule(media)).get("background-color")!);

    const desktop = chainAt(null);
    expect(desktop.names).toEqual(["--bgc-h-d"]);
    expect(desktop.tail).toContain("color-mix(");

    const tablet = chainAt(TABLET_MEDIA);
    expect(tablet.names).toEqual(["--bgc-h-t", "--bgc-h-d"]);
    expect(tablet.tail).toContain("var(--bgc-t, var(--bgc-d))");

    const mobile = chainAt(MOBILE_MEDIA);
    expect(mobile.names).toEqual(["--bgc-h-m", "--bgc-h-t", "--bgc-h-d"]);
    expect(mobile.tail).toContain("var(--bgc-m, var(--bgc-t, var(--bgc-d)))");
  });

  it("never redefines a base variable under the state", () => {
    for (const rule of rules.filter((candidate) =>
      candidate.selector.includes(":hover"),
    )) {
      for (const property of declarations(rule).keys()) {
        expect(
          property.startsWith("--"),
          `${rule.selector} redefines ${property}; an authored value is inline`,
        ).toBe(false);
      }
    }
  });

  it("changes only colour, so no hover can move its neighbours", () => {
    for (const rule of rules.filter((candidate) =>
      candidate.selector.includes(":hover"),
    )) {
      expect([...declarations(rule).keys()]).toEqual(["background-color"]);
    }
  });

  it("transitions the background instead of laying the button out again", () => {
    const [rule] = rulesFor(".puck-button", null);

    expect(rule, "puck-base.css has no .puck-button rule").toBeDefined();
    expect(declarations(rule).get("transition")).toContain("background-color");
  });
});

describe("Button hover variables", () => {
  function variantRule(selector: string): Rule {
    const [rule] = rulesFor(selector, null);

    if (!rule) {
      throw new Error(`${selector} has no rule in puck-base.css`);
    }

    return rule;
  }

  it.each(["outline", "ghost"] as const)(
    "dictates the %s hover in the variant's class, not on the instance",
    (variant) => {
      const rule = variantRule(`.puck-button-${variant}`);

      // The base value the hover rules out is the transparent one, and the
      // dictated surface is the theme's accent.
      expect(declarations(rule).get("--bgc-d")).toBe("transparent");
      expect(declarations(rule).get("--bgc-h-d")).toBe("var(--accent)");

      const root = renderRoot({ variant, link: LINK });
      expect(root).toContain(`puck-button-${variant}`);
      expect(root).not.toContain("--bgc-h-");
    },
  );

  it.each(["primary", "secondary"] as const)(
    "leaves the derived hover to the stylesheet for %s",
    (variant) => {
      // No state variable: the rule mixes the hover from the base background.
      expect(declarations(variantRule(`.puck-button-${variant}`)).has("--bgc-h-d")).toBe(
        false,
      );
      expect(renderRoot({ variant, link: LINK })).not.toContain("--bgc-h-");
    },
  );

  it("keeps the variant's dictated hover when the author paints a background", () => {
    const root = renderRoot(
      { variant: "ghost", link: LINK },
      { desktop: { backgroundColor: "#ff0000" } },
    );

    // The base value is the authored one and stays inline; the variant's class
    // still dictates the state, because the derived colour cannot read a
    // transparent surface.
    expect(root).toContain("--bgc-d:#ff0000");
    expect(root).toContain("puck-button-ghost");
    expect(root).not.toContain("--bgc-h-");
  });

  it("leaves an overridden primary's hover to derive from the authored colour", () => {
    const root = renderRoot(
      { variant: "primary", link: LINK },
      { desktop: { backgroundColor: "#ff0000" } },
    );

    // No state variable: the rule mixes the hover from this very background.
    expect(root).toContain("--bgc-d:#ff0000");
    expect(root).not.toContain("--bgc-h-");
  });

  it("falls back to the default variant's class for a stored unknown variant", () => {
    const root = renderRoot({
      variant: "invented" as ButtonVariant,
      link: LINK,
    });

    expect(root).toContain("puck-button-primary");
    expect(root).not.toContain("--bgc-h-");
  });

  it("appends the state as an infix before the breakpoint", () => {
    expect(
      getDecorationStateVars(
        { desktop: { backgroundColor: "var(--accent)" } },
        HOVER_STATE,
      ),
    ).toEqual({ "--bgc-h-d": "var(--accent)" });
  });
});

describe("Button hover target", () => {
  it("marks the anchor that carries the hover", () => {
    const root = renderUi({ link: LINK });

    expect(root.startsWith("<a ")).toBe(true);
    expect(root).toContain("puck-button");
  });

  it("marks the text fallback too, so the canvas can preview the state", () => {
    const root = renderUi({ link: { label: "Removed page" } as LinkProps });

    // The canvas holds an unresolved Smart link and draws it as text, while the
    // published page resolves the same document to an anchor. The class is on
    // both; the stylesheet's `a`-scoped page selector keeps the state off the
    // text fallback on the page.
    expect(root.startsWith("<span ")).toBe(true);
    expect(root).toContain("puck-button");
  });
});

describe("Button state surface", () => {
  it("ships only the read: no state control joins the panel", () => {
    expect(Object.keys(ButtonBlock.fields ?? {})).toEqual([
      "button",
      "layout",
      "size",
      "spacing",
      "typography",
      "decoration",
    ]);
  });
});
