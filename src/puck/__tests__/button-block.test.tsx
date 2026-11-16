import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { LinkProps } from "../fields/link/types";
import type { ButtonContentProps, ButtonVariant } from "../blocks/Button/types";

import { renderButtonBlock } from "../blocks/Button/render";
import { ButtonBlockUi } from "../blocks/Button/ui/button";
import { BUTTON_VARIANTS } from "../blocks/Button/constants";
import { BUTTON_DEFAULT_PROPS } from "../blocks/defaults";

import {
  declarations,
  readPuckBaseRules,
  type Rule,
} from "./helpers/css-rules";

/**
 * `DynamicIcon` keeps no DOM until its glyph chunk resolves, so the icon
 * assertions would have nothing to read in a server render. The stub keeps the
 * attributes the Button hands the icon — name, size and the silent marker —
 * which is exactly the contract under test.
 */
vi.mock("@/shared/ui/icon-picker", () => ({
  Icon: ({
    name,
    className,
    "aria-hidden": ariaHidden,
  }: {
    name?: string;
    className?: string;
    "aria-hidden"?: "true" | "false" | boolean;
  }) => (
    <svg
      data-icon={name}
      className={className}
      aria-hidden={ariaHidden}
      data-testid="button-icon"
    />
  ),
}));

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

function renderUi(button?: ButtonContentProps) {
  return renderToStaticMarkup(<ButtonBlockUi button={button} styleVars={{}} />);
}

describe("Button block", () => {
  it("renders an external smart link as an anchor", () => {
    const html = renderUi({ link: LINK });

    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain(">Example</a>");
  });

  it("opens external links in a new tab when requested", () => {
    const html = renderUi({
      link: { ...LINK, openInNewTab: true },
    });

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  it("renders an unresolved entity link as plain text", () => {
    const html = renderUi({
      link: { type: "page", pageId: "root-1", label: "About" },
    });

    expect(html).not.toContain("<a");
    expect(html).toContain(">About</span>");
  });

  it("renders a broken resolved link as plain text", () => {
    // The resolved shape of a broken target; the block reads label and href.
    const html = renderUi({ link: { label: "Removed page" } as LinkProps });

    expect(html).not.toContain("<a");
    expect(html).toContain(">Removed page</span>");
  });

  it("renders the anchor as its own root without a full-width wrapper", () => {
    const html = renderUi({ link: LINK });

    expect(rootTag(html).startsWith("<a ")).toBe(true);
    expect(rootTag(html)).not.toContain("w-full");
  });

  it("keeps rendering legacy { label, href } documents", () => {
    const html = renderUi({
      link: { label: "Legacy", href: "/legacy/" } as unknown as LinkProps,
    });

    expect(html).toContain('href="/legacy"');
    expect(html).toContain(">Legacy</a>");
  });
});

describe("Button block icon", () => {
  it("keeps the previous anchor layout when no icon is authored", () => {
    const html = renderUi({ link: LINK });

    expect(rootTag(html)).toContain("inline-block");
    expect(rootTag(html)).not.toContain("inline-flex");
    expect(rootTag(html)).not.toContain("gap:");
    expect(html).not.toContain("data-testid=\"button-icon\"");
  });

  it("renders the icon before the text inside the anchor, at one em", () => {
    const html = renderUi({
      link: LINK,
      icon: { name: "play" },
      iconPosition: "before",
    });

    const icon = html.indexOf('data-icon="play"');
    const text = html.indexOf("Example");

    expect(icon).toBeGreaterThan(html.indexOf("<a "));
    expect(icon).toBeLessThan(text);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("size-[1em]");
  });

  it("renders the icon after the text when that is the position", () => {
    const html = renderUi({
      link: LINK,
      icon: { name: "arrow-right" },
      iconPosition: "after",
    });

    const icon = html.indexOf('data-icon="arrow-right"');
    const text = html.indexOf("Example");

    expect(text).toBeGreaterThan(0);
    expect(icon).toBeGreaterThan(text);
    expect(html).toContain("</a>");
  });

  it("separates icon and text with the authored spacing", () => {
    const html = renderUi({
      link: LINK,
      icon: { name: "play" },
      iconSpacing: "0.75em",
    });

    expect(rootTag(html)).toContain("inline-flex");
    expect(rootTag(html)).toContain("items-center");
    expect(rootTag(html)).toContain("gap:0.75em");
  });

  it("falls back to half an em when the spacing is not authored", () => {
    const html = renderUi({ link: LINK, icon: { name: "play" } });

    expect(rootTag(html)).toContain("gap:0.5em");
  });

  it("does not announce the icon", () => {
    const html = renderUi({ link: LINK, icon: { name: "play" } });
    const iconTag = html.slice(
      html.indexOf("<svg"),
      html.indexOf(">", html.indexOf("<svg")) + 1,
    );

    expect(iconTag).toContain('aria-hidden="true"');
    expect(html).not.toContain("<title");
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(1);
  });

  it("keeps a broken target as selectable plain text, icon included", () => {
    const html = renderUi({
      link: { label: "Removed page" } as LinkProps,
      icon: { name: "play" },
    });

    expect(html).not.toContain("<a");
    expect(rootTag(html).startsWith("<span ")).toBe(true);
    expect(rootTag(html)).not.toContain("href");
    expect(rootTag(html)).not.toContain("tabindex");
    expect(html).toContain(">Removed page</span>");
    expect(html).toContain('data-icon="play"');
  });
});

/**
 * The variant is data: the document stores its name, and the block's own class
 * carries the look it starts from as Style variables. The render writes only
 * what the author authored, inline, where it outranks that class (ADR-0045).
 */

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "puck-button-primary",
  secondary: "puck-button-secondary",
  outline: "puck-button-outline",
  ghost: "puck-button-ghost",
};

/**
 * The Style variables a variant used to write onto every instance. They now
 * belong to the stylesheet, so a render that emits one has copied the look
 * back onto the element.
 */
const VARIANT_VARIABLES = [
  "--bgc-",
  "--tc-",
  "--bs-",
  "--bc-",
  "--btw-",
  "--brw-",
  "--bbw-",
  "--blw-",
  "--rtl-",
  "--rtr-",
  "--rbl-",
  "--rbr-",
  "--fw-",
];

function expectNoVariantVariable(root: string) {
  for (const variable of VARIANT_VARIABLES) {
    expect(root, `${variable}* belongs in the stylesheet`).not.toContain(
      variable,
    );
  }
}

describe("Button block variant", () => {
  it("starts from the default variant's class, with no variant variable inline", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({
        ...BUTTON_DEFAULT_PROPS,
        id: "button",
        puck: PUCK,
      }),
    );
    const root = rootTag(html);

    // A fresh Button is a primary call to action: the class supplies the look,
    // while the spacing default still writes the target-sized box.
    expect(root).toContain(VARIANT_CLASS.primary);
    expectNoVariantVariable(root);
    expect(root).toContain("--pt-d:0.5rem");
  });

  it.each(["primary", "secondary", "outline", "ghost"] as const)(
    "carries the %s class and no variant variable inline",
    (variant) => {
      const html = renderToStaticMarkup(
        renderButtonBlock({
          id: "button",
          button: { variant, link: LINK },
          puck: PUCK,
        }),
      );

      expect(rootTag(html)).toContain(VARIANT_CLASS[variant]);
      expectNoVariantVariable(rootTag(html));
    },
  );

  it("starts a variant-less button from primary's class", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({ id: "button", button: { link: LINK }, puck: PUCK }),
    );

    expect(rootTag(html)).toContain(VARIANT_CLASS.primary);
    expectNoVariantVariable(rootTag(html));
  });

  it("still writes an authored value inline, at the breakpoint it was authored at", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { variant: "primary", link: LINK },
        decoration: {
          desktop: { backgroundColor: "#ff0000" },
          mobile: { borderColor: "#00ff00" },
        },
        typography: {
          tablet: { fontSize: "2rem", color: "#0000ff" },
        },
        puck: PUCK,
      }),
    );
    const root = rootTag(html);

    // The class stays on the root; the authored values sit above it.
    expect(root).toContain(VARIANT_CLASS.primary);
    expect(root).toContain("--bgc-d:#ff0000");
    expect(root).toContain("--bc-m:#00ff00");
    expect(root).toContain("--fs-t:2rem");
    expect(root).toContain("--tc-t:#0000ff");
  });

  it("brings the variant's value back when an authored value is cleared", () => {
    const cleared = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { variant: "primary", link: LINK },
        // A cleared colour control leaves the key behind with `undefined`; that
        // counts as no authored value, like a key the panel has removed.
        decoration: { desktop: { backgroundColor: undefined } },
        typography: { desktop: { color: undefined } },
        puck: PUCK,
      }),
    );
    const root = rootTag(cleared);

    expect(root).toContain(VARIANT_CLASS.primary);
    expectNoVariantVariable(root);
  });

  it("falls back to primary when a stored variant is not one of the four", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { link: LINK, variant: "invented" as ButtonVariant },
        puck: PUCK,
      }),
    );
    const root = rootTag(html);

    expect(root).toContain(VARIANT_CLASS.primary);
    expect(root).not.toContain("invented");
    expectNoVariantVariable(root);
  });

  it("puts the same variant class on an anchor and on the plain-text fallback", () => {
    const anchor = rootTag(renderUi({ variant: "outline", link: LINK }));
    const text = rootTag(
      renderUi({
        variant: "outline",
        link: { label: "Removed page" } as LinkProps,
      }),
    );

    expect(anchor.startsWith("<a ")).toBe(true);
    expect(text.startsWith("<span ")).toBe(true);

    for (const root of [anchor, text]) {
      expect(root).toContain("puck-button");
      expect(root).toContain(VARIANT_CLASS.outline);
    }
  });

  it("renders the same variant markup in the canvas and on the published page", () => {
    const props = {
      id: "button",
      button: { variant: "ghost" as const, link: LINK },
      puck: PUCK,
    };

    const published = renderToStaticMarkup(renderButtonBlock(props));
    const editing = renderToStaticMarkup(
      renderButtonBlock({ ...props, puck: { ...PUCK, isEditing: true } }),
    );

    expect(editing).toBe(published);
    expect(rootTag(published)).toContain(VARIANT_CLASS.ghost);
  });
});

/**
 * The stylesheet is the source of truth for the four looks.
 *
 * A variant rule declares only custom properties: a property would outrank the
 * variables `.puck-deco` and `.puck-typo` read, so an empty Decoration field
 * could not reach the class's value, and an authored value would need a third
 * mechanism to win. It declares the desktop rung only; the ladder carries the
 * value to tablet and mobile (ADR-0045).
 */
describe("Button variant stylesheet", () => {
  const rules = readPuckBaseRules();

  const selector = (variant: ButtonVariant) => `.${VARIANT_CLASS[variant]}`;

  function selectorsOf(rule: Rule) {
    return rule.selector.split(",").map((part) => part.trim());
  }

  function rulesFor(variant: ButtonVariant) {
    return rules.filter((rule) => selectorsOf(rule).includes(selector(variant)));
  }

  function ruleFor(variant: ButtonVariant): Rule {
    const [rule] = rulesFor(variant);

    if (!rule) {
      throw new Error(`puck-base.css has no ${selector(variant)} rule`);
    }

    return rule;
  }

  /** What every variant shares: the box and the weight. */
  const SHARED_DECLARATIONS: Record<string, string> = {
    "--bs-d": "solid",
    "--btw-d": "1px",
    "--brw-d": "1px",
    "--bbw-d": "1px",
    "--blw-d": "1px",
    "--rtl-d": "var(--radius)",
    "--rtr-d": "var(--radius)",
    "--rbl-d": "var(--radius)",
    "--rbr-d": "var(--radius)",
    "--fw-d": "500",
  };

  /** The theme tokens the rest of the site already uses, plus the dictated hover. */
  const VARIANT_DECLARATIONS: Record<ButtonVariant, Record<string, string>> = {
    primary: {
      "--bgc-d": "var(--primary)",
      "--bc-d": "var(--primary)",
      "--tc-d": "var(--primary-foreground)",
    },
    secondary: {
      "--bgc-d": "var(--secondary)",
      "--bc-d": "var(--secondary)",
      "--tc-d": "var(--secondary-foreground)",
    },
    outline: {
      "--bgc-d": "transparent",
      "--bc-d": "var(--border)",
      "--tc-d": "var(--foreground)",
      "--bgc-h-d": "var(--accent)",
    },
    ghost: {
      "--bgc-d": "transparent",
      "--bc-d": "transparent",
      "--tc-d": "var(--foreground)",
      "--bgc-h-d": "var(--accent)",
    },
  };

  it.each(["primary", "secondary", "outline", "ghost"] as const)(
    "holds the %s look once, on the desktop rung, as Style variables",
    (variant) => {
      // The look is declared once, on the desktop rung: the ladder carries it
      // to tablet and mobile. An authored value is inline and outranks the
      // class at every rung, so a value written on a wider rung is what the
      // narrower ones inherit — the same rule every other block follows.
      expect(rulesFor(variant)).toHaveLength(1);

      const rule = ruleFor(variant);
      expect(rule.media).toBeNull();
      expect(Object.fromEntries(declarations(rule))).toEqual({
        ...SHARED_DECLARATIONS,
        ...VARIANT_DECLARATIONS[variant],
      });
    },
  );

  it("paints every variant the panel offers", () => {
    // The panel and the render read one list: a variant the author can pick
    // must have a class the stylesheet paints, not a look lost in TypeScript.
    for (const variant of BUTTON_VARIANTS) {
      expect(
        rulesFor(variant),
        `${selector(variant)} must paint ${variant}`,
      ).toHaveLength(1);
    }
  });

  it.each(["primary", "secondary", "outline", "ghost"] as const)(
    "declares only custom properties and no !important for %s",
    (variant) => {
      for (const [property, value] of declarations(ruleFor(variant))) {
        expect(
          property.startsWith("--"),
          `${selector(variant)} declares ${property}; a property would outrank the variables`,
        ).toBe(true);
        expect(value).not.toContain("!important");
      }
    },
  );

  /**
   * `.puck-deco` and `.puck-typo` reset the variables to `initial` at equal
   * specificity, so a variant rule placed before them would be erased.
   */
  function resetRuleIndex(resetSelector: string, property: string) {
    return rules.findIndex(
      (rule) =>
        rule.media === null &&
        selectorsOf(rule).includes(resetSelector) &&
        declarations(rule).has(property),
    );
  }

  it("declares each variant after the reset scopes it has to outrank", () => {
    const boxReset = resetRuleIndex(".puck-deco", "--bgc-d");
    const typeReset = resetRuleIndex(".puck-typo", "--fw-d");

    expect(boxReset).toBeGreaterThanOrEqual(0);
    expect(typeReset).toBeGreaterThanOrEqual(0);

    for (const variant of ["primary", "secondary", "outline", "ghost"] as const) {
      const index = rules.indexOf(ruleFor(variant));

      expect(index).toBeGreaterThan(boxReset);
      expect(index).toBeGreaterThan(typeReset);
    }
  });
});

/**
 * A Button root is the anchor, so it is the flex or grid item its parent lays
 * out. A block base width keeps `auto` from stretching, and an authored width
 * still outranks it. Neither case is a stored document value.
 */
describe("Button block base width", () => {
  it("emits the natural width on an unauthored size", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({ id: "button", button: { link: LINK }, puck: PUCK }),
    );

    expect(rootTag(html)).toContain("--w-d:fit-content");
  });

  it("lets an authored width win over the base width", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { link: LINK },
        size: { desktop: { width: "50%" } },
        puck: PUCK,
      }),
    );

    expect(rootTag(html)).toContain("--w-d:50%");
    expect(rootTag(html)).not.toContain("fit-content");
  });

  it("hugs a max width instead of filling the container", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { link: LINK },
        size: { desktop: { maxWidth: "30rem" } },
        puck: PUCK,
      }),
    );

    expect(rootTag(html)).toContain("--w-d:fit-content");
    expect(rootTag(html)).toContain("--mw-d:30rem");
    expect(rootTag(html)).not.toContain("--w-d:100%");
  });

  it("still applies the base width when the document authored spacing values", () => {
    // Nearly every existing Button authored padding or margins. A document
    // default would have been dropped by Puck's shallow merge for exactly these
    // documents; the block base width is read independently of the object.
    const html = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { link: LINK },
        spacing: { desktop: { paddingTop: "12px" } },
        puck: PUCK,
      }),
    );

    expect(rootTag(html)).toContain("--w-d:fit-content");
    expect(rootTag(html)).toContain("--pt-d:12px");
  });

  it("renders the same markup while editing as on the published page", () => {
    const props = {
      id: "button",
      button: { link: LINK },
      size: { desktop: { maxWidth: "30rem" } },
      puck: PUCK,
    };

    const published = renderToStaticMarkup(renderButtonBlock(props));
    const editing = renderToStaticMarkup(
      renderButtonBlock({ ...props, puck: { ...PUCK, isEditing: true } }),
    );

    expect(editing).toBe(published);
  });
});
