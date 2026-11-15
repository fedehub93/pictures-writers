import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { LinkProps } from "../fields/link/types";
import type { ButtonContentProps, ButtonVariant } from "../blocks/Button/types";

import { renderButtonBlock } from "../blocks/Button/render";
import { ButtonBlockUi } from "../blocks/Button/ui/button";
import { BUTTON_DEFAULT_PROPS } from "../blocks/defaults";

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
 * The variant is data, not a class: the render emits its Decoration and
 * Typography values as the same style variables an authored value emits, and
 * the authored value wins where it exists.
 */
describe("Button block variant", () => {
  it("emits a complete primary button from the block's defaults", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({
        ...BUTTON_DEFAULT_PROPS,
        id: "button",
        puck: PUCK,
      }),
    );
    const root = rootTag(html);

    // A fresh Button is a primary call to action, not a bare label: the
    // variant supplies the colours and the defaults supply the target size.
    expect(root).toContain("--bgc-d:var(--primary)");
    expect(root).toContain("--tc-d:var(--primary-foreground)");
    expect(root).toContain("--pt-d:0.5rem");
    expect(root).toContain("--pl-d:1rem");
  });

  it("starts a variant-less button from primary, at every breakpoint", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({ id: "button", button: { link: LINK }, puck: PUCK }),
    );
    const root = rootTag(html);

    for (const suffix of ["d", "t", "m"]) {
      expect(root).toContain(`--bgc-${suffix}:var(--primary)`);
      expect(root).toContain(`--tc-${suffix}:var(--primary-foreground)`);
    }
  });

  /**
   * The expected values come from the theme tokens the rest of the site
   * already uses, not from the variant table.
   */
  it.each([
    {
      variant: "primary",
      backgroundColor: "var(--primary)",
      color: "var(--primary-foreground)",
      borderColor: "var(--primary)",
    },
    {
      variant: "secondary",
      backgroundColor: "var(--secondary)",
      color: "var(--secondary-foreground)",
      borderColor: "var(--secondary)",
    },
    {
      variant: "outline",
      backgroundColor: "transparent",
      color: "var(--foreground)",
      borderColor: "var(--border)",
    },
    {
      variant: "ghost",
      backgroundColor: "transparent",
      color: "var(--foreground)",
      borderColor: "transparent",
    },
  ] as const)(
    "emits the $variant style variables at every breakpoint",
    ({ variant, backgroundColor, color, borderColor }) => {
      const html = renderToStaticMarkup(
        renderButtonBlock({
          id: "button",
          button: { variant, link: LINK },
          puck: PUCK,
        }),
      );
      const root = rootTag(html);

      for (const suffix of ["d", "t", "m"]) {
        expect(root).toContain(`--bgc-${suffix}:${backgroundColor}`);
        expect(root).toContain(`--tc-${suffix}:${color}`);
        expect(root).toContain(`--bc-${suffix}:${borderColor}`);
        expect(root).toContain(`--btw-${suffix}:1px`);
        expect(root).toContain(`--rtl-${suffix}:var(--radius)`);
      }
    },
  );

  it("lets an authored value win at its breakpoint and keeps the variant elsewhere", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { variant: "primary", link: LINK },
        decoration: { desktop: { backgroundColor: "#ff0000" } },
        typography: { desktop: { color: "#0000ff" } },
        puck: PUCK,
      }),
    );
    const root = rootTag(html);

    expect(root).toContain("--bgc-d:#ff0000");
    expect(root).toContain("--tc-d:#0000ff");
    expect(root).toContain("--bgc-t:var(--primary)");
    expect(root).toContain("--tc-t:var(--primary-foreground)");
    expect(root).toContain("--bgc-m:var(--primary)");
    expect(root).toContain("--tc-m:var(--primary-foreground)");
  });

  it("brings the variant's value back when an authored value is cleared", () => {
    const authored = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { variant: "primary", link: LINK },
        decoration: { desktop: { backgroundColor: "#ff0000" } },
        puck: PUCK,
      }),
    );
    // A cleared colour control leaves the key behind with `undefined`; that
    // counts as no authored value, like a key the panel has removed.
    const cleared = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { variant: "primary", link: LINK },
        decoration: { desktop: { backgroundColor: undefined } },
        typography: { desktop: { color: undefined } },
        puck: PUCK,
      }),
    );

    expect(rootTag(authored)).toContain("--bgc-d:#ff0000");
    expect(rootTag(cleared)).not.toContain("#ff0000");
    expect(rootTag(cleared)).toContain("--bgc-d:var(--primary)");
    expect(rootTag(cleared)).toContain("--tc-d:var(--primary-foreground)");
  });

  it("falls back to primary when a stored variant is not one of the four", () => {
    const html = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { link: LINK, variant: "invented" as ButtonVariant },
        puck: PUCK,
      }),
    );

    expect(rootTag(html)).toContain("--bgc-d:var(--primary)");
    expect(rootTag(html)).toContain("--tc-d:var(--primary-foreground)");
  });

  it("keeps every authored value when the variant changes", () => {
    const authored = {
      decoration: {
        desktop: { backgroundColor: "#ff0000" },
        mobile: { borderColor: "#00ff00" },
      },
      typography: {
        tablet: { fontSize: "2rem", color: "#0000ff" },
      },
    };

    const html = renderToStaticMarkup(
      renderButtonBlock({
        id: "button",
        button: { variant: "ghost", link: LINK },
        ...authored,
        puck: PUCK,
      }),
    );
    const root = rootTag(html);

    // The authored values survive at every breakpoint they were written at.
    expect(root).toContain("--bgc-d:#ff0000");
    expect(root).toContain("--bc-m:#00ff00");
    expect(root).toContain("--fs-t:2rem");
    expect(root).toContain("--tc-t:#0000ff");

    // The variant re-emits where the author wrote nothing.
    expect(root).toContain("--bgc-t:transparent");
    expect(root).toContain("--bgc-m:transparent");
    expect(root).toContain("--tc-d:var(--foreground)");
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
