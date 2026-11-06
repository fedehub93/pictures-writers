import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/blog/",
}));

import { NavbarBlock } from "../blocks/NavbarBlock";
import {
  NAVBAR_BLOCK_DEFAULT_CONTENT,
  NAVBAR_LAYOUT_ITEMS,
} from "../blocks/NavbarBlock/defaults";
import { isNavLinkActive } from "../blocks/NavbarBlock/lib/menu";
import { renderNavbarBlock } from "../blocks/NavbarBlock/render";
import type { NavItemUi } from "../blocks/NavbarBlock/types";
import { NavbarCard } from "../blocks/NavbarBlock/ui/navbar-card";
import { NavbarDesktopMenu } from "../blocks/NavbarBlock/ui/desktop-menu";
import { NavLinkList } from "../blocks/NavbarBlock/ui/nav-link-list";
import { NavbarMobileList } from "../blocks/NavbarBlock/ui/mobile-menu";

const ITEMS: NavItemUi[] = [
  { type: "link", label: "Home", link: { label: "Home", href: "/" } },
  {
    type: "column",
    label: "Risorse",
    items: [
      { label: "Blog", link: { label: "Blog", href: "/blog/" } },
      { label: "Ebooks", link: { label: "Ebooks", href: "/shop/ebooks/" } },
    ],
  },
  {
    type: "card",
    label: "Workbook",
    description: "Una guida pratica alla sceneggiatura.",
    imageUrl: "/cover.png",
    link: { label: "Workbook", href: "/shop/workbook/" },
  },
  {
    type: "cta",
    label: "Contatti",
    link: { label: "Contatti", href: "/contatti/" },
    variant: "secondary",
  },
];

describe("NavbarBlock", () => {
  it("renders the desktop menu as a navigation menu", () => {
    const html = renderToStaticMarkup(
      <NavbarDesktopMenu items={ITEMS} pathname="/blog/" />,
    );

    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toContain("hidden");
    expect(html).toContain("md:flex");
    expect(html).toContain('href="/"');
    expect(html).toContain(">Home<");
    expect(html).toContain("Risorse");
    expect(html).toContain("Workbook");
    expect(html).toContain(">Contatti<");
  });

  it("marks the direct link matching the current path", () => {
    const html = renderToStaticMarkup(
      <NavbarDesktopMenu
        items={[
          { type: "link", label: "Blog", link: { label: "Blog", href: "/blog/" } },
        ]}
        pathname="/blog/"
      />,
    );

    expect(html).toContain("text-primary");
  });

  it("renders the mobile menu structure with every item type", () => {
    const html = renderToStaticMarkup(
      <NavbarMobileList items={ITEMS} pathname="/blog/" />,
    );

    expect(html).toContain('aria-label="Mobile navigation"');
    expect(html).toContain(">Home<");
    expect(html).toContain(">Risorse<");
    expect(html).toContain(">Workbook<");
    expect(html).toContain(">Contatti<");
    expect(html).toContain("Una guida pratica alla sceneggiatura.");
  });

  it("renders a column as a list of resolved links", () => {
    const html = renderToStaticMarkup(
      <NavLinkList
        links={[
          { label: "Blog", link: { label: "Blog", href: "/blog/" } },
          { label: "Bozza", link: { type: "page", pageId: "draft" } },
        ]}
        pathname="/blog/"
      />,
    );

    expect(html).toContain('href="/blog"');
    expect(html).toContain(">Blog</a>");
    expect(html).toContain(">Bozza</span>");
  });

  it("renders a card with its image, description and link", () => {
    const html = renderToStaticMarkup(
      <NavbarCard
        label="Workbook"
        description="Una guida pratica."
        imageUrl="/cover.png"
        link={{ label: "Workbook", href: "/shop/workbook/" }}
        pathname="/shop/workbook/"
      />,
    );

    expect(html).toContain('src="/cover.png"');
    expect(html).toContain("Una guida pratica.");
    expect(html).toContain('href="/shop/workbook"');
    expect(html).toContain(">Workbook<");
  });

  it("applies dimension and decoration as responsive CSS custom properties", () => {
    const html = renderToStaticMarkup(
      renderNavbarBlock({
        content: { items: ITEMS, layout: "compact" },
        dimension: {
          desktop: { marginTop: "12px", paddingRight: "16px" },
          tablet: { paddingBottom: "8px" },
        },
        decoration: {
          desktop: {
            backgroundColor: "var(--accent)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--accent-foreground)",
            borderTopRightRadius: "8px",
            opacity: "0.9",
          },
        },
      }),
    );

    expect(html).toContain("puck-dim puck-deco");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--pr-d:16px");
    expect(html).toContain("--pb-t:8px");
    expect(html).toContain("--bgc-d:var(--accent)");
    expect(html).toContain("--bw-d:1px");
    expect(html).toContain("--bs-d:solid");
    expect(html).toContain("--bc-d:var(--accent-foreground)");
    expect(html).toContain("--rtr-d:8px");
    expect(html).toContain("--op-d:0.9");
  });

  it("renders an intrinsic root that inherits alignment from its parent", () => {
    const html = renderToStaticMarkup(
      renderNavbarBlock({ content: { items: ITEMS } }),
    );
    const rootTag = html.slice(0, html.indexOf(">") + 1);

    expect(rootTag).toContain("puck-dim puck-deco");
    expect(rootTag).not.toContain("w-full");
    expect(rootTag).not.toContain("justify-end");
  });

  it("keeps navigation spacing and surface opt-in when no values are configured", () => {
    const html = renderToStaticMarkup(
      renderNavbarBlock({ content: { items: ITEMS } }),
    );

    expect(html).toContain("puck-dim puck-deco");
    expect(html).not.toContain("--bgc-d");
    expect(html).not.toContain("--mt-d");
    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toContain('aria-label="Open menu"');
  });

  it("keeps the mega layout available while defaulting new navbars to compact", () => {
    expect(NAVBAR_LAYOUT_ITEMS).toEqual([
      { value: "mega", title: "Mega menu" },
      { value: "compact", title: "Compact menu" },
    ]);
    expect(NAVBAR_BLOCK_DEFAULT_CONTENT.layout).toBe("compact");
  });

  it("exposes one Navigation content section, dimension, decoration and a compact default", () => {
    expect(NavbarBlock.defaultProps).toEqual({
      content: NAVBAR_BLOCK_DEFAULT_CONTENT,
    });
    expect(NavbarBlock.defaultProps?.content?.layout).toBe("compact");
    expect(NavbarBlock.defaultProps?.content?.items).toHaveLength(1);

    const fields = (NavbarBlock.fields ?? {}) as Record<string, unknown>;

    expect(fields.content).toMatchObject({ type: "custom" });
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("decoration");
    expect(fields).not.toHaveProperty("items");
    expect(fields).not.toHaveProperty("layout");
    expect(fields).not.toHaveProperty("typography");
  });
});

describe("isNavLinkActive", () => {
  it("matches the exact path with or without a trailing slash", () => {
    expect(isNavLinkActive("/about/", "/about/")).toBe(true);
    expect(isNavLinkActive("/about/", "/about")).toBe(true);
    expect(isNavLinkActive("/about/", "/about-us/")).toBe(false);
  });

  it("treats a section link as active for its children", () => {
    expect(isNavLinkActive("/shop/ebooks/workbook/", "/shop/")).toBe(true);
    expect(isNavLinkActive("/blog/", "/shop/")).toBe(false);
  });

  it("only treats the root as active on the home page", () => {
    expect(isNavLinkActive("/", "/")).toBe(true);
    expect(isNavLinkActive("/blog/", "/")).toBe(false);
  });

  it("ignores external links, query strings and missing paths", () => {
    expect(isNavLinkActive("/blog/", "https://example.com/")).toBe(false);
    expect(isNavLinkActive("/blog/", undefined)).toBe(false);
    expect(isNavLinkActive(null, "/blog/")).toBe(false);
    expect(isNavLinkActive("/blog/?page=2", "/blog/")).toBe(true);
  });
});
