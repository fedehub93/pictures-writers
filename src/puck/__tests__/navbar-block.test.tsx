import type { CustomField } from "@puckeditor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/blog/",
}));

/**
 * The menu editor only needs the tRPC hook to build entity-picker query
 * options; external links do not run a query, so a static fake is enough.
 */
vi.mock("@/trpc/client", () => {
  const queryOptions = (input: unknown) => ({
    queryKey: ["navbar-block-test", input],
    queryFn: () => new Promise<never>(() => undefined),
  });
  const getMany = { getMany: { queryOptions } };

  return {
    useTRPC: () => ({
      pages: getMany,
      posts: getMany,
      products: getMany,
      categories: getMany,
      productCategories: getMany,
    }),
  };
});

import { NavbarBlock } from "../blocks/NavbarBlock";
import {
  NAVBAR_BLOCK_DEFAULT_CONTENT,
  NAVBAR_LAYOUT_ITEMS,
} from "../blocks/NavbarBlock/defaults";
import { NavbarContentField } from "../blocks/NavbarBlock/field";
import { isNavLinkActive } from "../blocks/NavbarBlock/lib/menu";
import { renderNavbarBlock } from "../blocks/NavbarBlock/render";
import { NavbarStyleField } from "../blocks/NavbarBlock/style-field";
import type {
  NavItem,
  NavItemUi,
  NavbarBlockContent,
  NavbarColumnChildUi,
} from "../blocks/NavbarBlock/types";
import { NavbarCard } from "../blocks/NavbarBlock/ui/navbar-card";
import {
  NavbarDesktopColumnPanel,
  NavbarDesktopMenu,
} from "../blocks/NavbarBlock/ui/desktop-menu";
import {
  NavbarMobileColumnList,
  NavLinkList,
} from "../blocks/NavbarBlock/ui/nav-link-list";
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

const MEGA_COLUMN: NavItemUi = {
  type: "column",
  label: "Risorse",
  items: [
    {
      label: "Formazione",
      description: "Scuole e corsi di sceneggiatura.",
      icon: { name: "school" },
      link: { label: "Formazione", href: "/blog/scuole-di-sceneggiatura/" },
    },
    {
      label: "Prossimamente",
      icon: { name: "trophy" },
      link: { type: "page", pageId: "draft" },
    },
  ],
};

const MEGA_COLUMN_CHILDREN = MEGA_COLUMN.items as NavbarColumnChildUi[];

describe("NavbarBlock", () => {
  it("renders the desktop menu as a navigation menu", () => {
    const html = renderToStaticMarkup(
      <NavbarDesktopMenu items={ITEMS} pathname="/blog/" />,
    );

    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toContain("hidden");
    expect(html).toContain("md:flex");
    expect(html).toContain("puck-nav-label");
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
    expect(html).toContain("puck-nav-label");
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

  it("renders a mega panel column as a grid of cards as a grid of cards", () => {
    const html = renderToStaticMarkup(
      <NavbarDesktopColumnPanel
        items={MEGA_COLUMN_CHILDREN}
        layout="mega"
        pathname="/blog/"
      />,
    );

    expect(html).toContain("grid-cols-2");
    expect(html).toContain("31.25rem");
    expect(html).toContain("lg:w-[min(90vw,37.5rem)]");
    expect(html).toContain(">Formazione<");
    expect(html).toContain("Scuole e corsi di sceneggiatura.");
    expect(html).toContain('href="/blog/scuole-di-sceneggiatura"');
    expect(html).toContain("data-navbar-icon");
  });

  it("keeps a mega panel column compact, as a single-column list of links", () => {
    const html = renderToStaticMarkup(
      <NavbarDesktopColumnPanel
        items={MEGA_COLUMN_CHILDREN}
        layout="compact"
        pathname="/blog/"
      />,
    );

    expect(html).toContain("w-56");
    expect(html).toContain("flex flex-col");
    expect(html).not.toContain("37.5rem");
    expect(html).not.toContain("grid-cols-2");
    expect(html).not.toContain("data-navbar-icon");
    expect(html).not.toContain("Scuole e corsi di sceneggiatura.");
  });

  it("keeps a legacy column without descriptions or icons unchanged", () => {
    const legacy = [
      { label: "Blog", link: { label: "Blog", href: "/blog/" } },
      { label: "Ebooks", link: { label: "Ebooks", href: "/shop/ebooks/" } },
    ];

    const mega = renderToStaticMarkup(
      <NavbarDesktopColumnPanel items={legacy} layout="mega" pathname="/blog/" />,
    );
    const compact = renderToStaticMarkup(
      <NavbarDesktopColumnPanel
        items={legacy}
        layout="compact"
        pathname="/blog/"
      />,
    );

    expect(mega).toContain("w-[min(90vw,34rem)]");
    expect(mega).toContain("grid grid-cols-2 gap-1");
    expect(mega).not.toContain("data-navbar-icon");
    expect(compact).toContain("w-56");
    expect(compact).toContain("flex flex-col");
  });

  it("keeps every column item inside the desktop navigation menu", () => {
    const html = renderToStaticMarkup(
      <NavbarDesktopMenu
        items={[MEGA_COLUMN]}
        layout="mega"
        pathname="/blog/"
      />,
    );

    expect(html).toContain("Risorse");
    expect(html).toContain("lucide-chevron-down");
  });

  it("renders mega panel children as mobile rows with icon, label and description", () => {
    const html = renderToStaticMarkup(
      <NavbarMobileColumnList links={MEGA_COLUMN_CHILDREN} pathname="/blog/" />,
    );

    expect(html).toContain("data-navbar-icon");
    expect(html).toContain(">Formazione<");
    expect(html).toContain("Scuole e corsi di sceneggiatura.");
    expect(html).toContain('href="/blog/scuole-di-sceneggiatura"');
    expect(html).toContain(">Prossimamente</span>");
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
    expect(html).not.toContain("--nav-fs");
    expect(html).not.toContain("--nav-gap");
    expect(html).toContain("puck-nav-row");
    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toContain('aria-label="Open menu"');
  });

  it("emits the navigation style variables with the desktop → mobile cascade", () => {
    const html = renderToStaticMarkup(
      renderNavbarBlock({
        content: { items: ITEMS },
        appearance: {
          desktop: { fontSize: "18px", itemSpacing: "12px" },
          mobile: { fontSize: "20px" },
        },
      }),
    );

    expect(html).toContain("--nav-fs-d:18px");
    expect(html).toContain("--nav-fs-t:18px");
    expect(html).toContain("--nav-fs-m:20px");
    expect(html).toContain("--nav-gap-d:12px");
    expect(html).toContain("--nav-gap-t:12px");
    expect(html).toContain("--nav-gap-m:12px");
  });

  it("only emits the values authored at or above a breakpoint", () => {
    const html = renderToStaticMarkup(
      renderNavbarBlock({
        content: { items: ITEMS },
        appearance: { tablet: { fontSize: "1rem" } },
      }),
    );

    expect(html).not.toContain("--nav-fs-d");
    expect(html).toContain("--nav-fs-t:1rem");
    expect(html).toContain("--nav-fs-m:1rem");
    expect(html).not.toContain("--nav-gap");
  });

  it("keeps the mega layout available while defaulting new navbars to compact", () => {
    expect(NAVBAR_LAYOUT_ITEMS).toEqual([
      { value: "mega", title: "Mega menu" },
      { value: "compact", title: "Compact menu" },
    ]);
    expect(NAVBAR_BLOCK_DEFAULT_CONTENT.layout).toBe("compact");
  });

  it("exposes one Navigation content section, the shared style fields and a compact default", () => {
    expect(NavbarBlock.defaultProps).toEqual({
      content: NAVBAR_BLOCK_DEFAULT_CONTENT,
    });
    expect(NavbarBlock.defaultProps?.content?.layout).toBe("compact");
    expect(NavbarBlock.defaultProps?.content?.items).toHaveLength(1);

    const fields = (NavbarBlock.fields ?? {}) as Record<string, unknown>;

    expect(fields.content).toMatchObject({ type: "custom" });
    expect(fields).toHaveProperty("appearance");
    expect(fields.appearance).toBe(NavbarStyleField);
    expect(fields).toHaveProperty("layout");
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("decoration");
    expect(fields).not.toHaveProperty("items");
    expect(fields).not.toHaveProperty("typography");
  });
});

function renderNavbarField(items: NavItem[]) {
  const field = NavbarContentField as CustomField<NavbarBlockContent | undefined>;

  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {field.render({
        field,
        name: "content",
        id: "content",
        value: { layout: "mega", items },
        onChange: () => undefined,
      })}
    </QueryClientProvider>,
  );
}

describe("NavbarBlock editor field", () => {
  it("renders the layout control and a summary instead of the item editor", () => {
    const html = renderNavbarField([
      { type: "link", label: "Blog", link: { type: "external", url: "/blog/" } },
      {
        type: "column",
        label: "Risorse",
        items: [
          {
            label: "Blog",
            description: "Articoli e approfondimenti.",
            icon: { name: "newspaper" },
            link: { type: "external", url: "/blog/" },
          },
        ],
      },
    ]);

    expect(html).toContain("Desktop layout");
    expect(html).toContain("Mega menu");
    expect(html).toContain("Compact menu");
    expect(html).toContain("2 items");
    expect(html).toContain("Edit items");

    // The item editor only lives in the dialog, so none of its controls are
    // rendered inside the 300px sidebar.
    expect(html).not.toContain("Menu label");
    expect(html).not.toContain("Add link");
    expect(html).not.toContain("Add column");
    expect(html).not.toContain("Destination");
    expect(html).not.toContain(">Icon</span>");
  });

  it("uses the singular for a one-item menu", () => {
    const html = renderNavbarField([
      { type: "link", label: "Home", link: { type: "external", url: "/" } },
    ]);

    expect(html).toContain(">1 item<");
    expect(html).not.toContain(">1 items<");
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
