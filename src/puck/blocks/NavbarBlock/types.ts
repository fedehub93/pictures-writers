import type { DecorationProps } from "@/puck/fields/decoration";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { IconProps } from "@/puck/fields/icon";
import type { LayoutProps } from "@/puck/fields/layout";
import type {
  LegacyLinkProps,
  LinkProps,
} from "@/puck/fields/link/types";
import type { BlockDragRef } from "@/puck/types";
import type { Responsive } from "@/puck/utils/responsive";

export type NavbarLayout = "mega" | "compact";

/**
 * Viewport at which the desktop navigation is replaced by the hamburger.
 *
 * It is expressed with the same bucket names as the shared responsive ladder,
 * so a block hidden "on tablet" and a navbar collapsing "at tablet" switch at
 * the same width.
 */
export type NavbarCollapse = "mobile" | "tablet";

export type NavbarCtaVariant = "primary" | "secondary";

export const NAV_ITEM_TYPES = ["link", "column", "card", "cta"] as const;

export type NavItemType = (typeof NAV_ITEM_TYPES)[number];

export const NAV_ITEM_TYPE_LABELS: Record<NavItemType, string> = {
  link: "Link",
  column: "Column",
  card: "Card",
  cta: "CTA",
};

/**
 * Puck link shape accepted at render time: either a SmartLink still waiting
 * for server-side resolution, or the `{ label, href }` shape written by the
 * resolver.
 */
export type NavbarMenuLink = LinkProps | LegacyLinkProps;

/**
 * Stored child of a `column` item.
 *
 * The optional `description` and `icon` are what let the mega layout promote a
 * column from a plain list of links to a grid of cards. Older documents only
 * carry `label` and `link`, and must keep rendering exactly as before.
 */
export type NavbarColumnChild = {
  label: string;
  link: LinkProps;
  description?: string;
  icon?: IconProps;
};

/** Runtime shape of a column child after server-side resolution. */
export type NavbarColumnChildUi = {
  label: string;
  link?: NavbarMenuLink;
  description?: string;
  icon?: IconProps;
};

/** Fully resolved column child: the link always carries a label. */
export type ResolvedNavbarColumnChild = {
  label: string;
  link: ResolvedNavLink;
  description?: string;
  icon?: IconProps;
};

/**
 * Stored navbar tree.
 *
 * Items are deliberately a closed, typed union instead of Puck children: the
 * header needs a deterministic desktop/mobile projection, and the editor must
 * not be able to nest arbitrary blocks inside the navigation.
 */
export type NavItem =
  | { type: "link"; label: string; link: LinkProps }
  | {
      type: "column";
      label: string;
      items: NavbarColumnChild[];
    }
  | {
      type: "card";
      label: string;
      description?: string;
      imageUrl?: string;
      icon?: IconProps;
      link: LinkProps;
    }
  | {
      type: "cta";
      label: string;
      link: LinkProps;
      variant?: NavbarCtaVariant;
    };

/**
 * Runtime shape after server-side resolution. Entity links become
 * `{ label, href }`, while missing/unpublished targets keep their label but
 * lose the href, so the renderer can fall back to plain text.
 */
export type NavItemUi =
  | { type: "link"; label: string; link?: NavbarMenuLink }
  | {
      type: "column";
      label: string;
      items?: NavbarColumnChildUi[];
    }
  | {
      type: "card";
      label: string;
      description?: string;
      imageUrl?: string;
      icon?: IconProps;
      link?: NavbarMenuLink;
    }
  | {
      type: "cta";
      label: string;
      link?: NavbarMenuLink;
      variant?: NavbarCtaVariant;
    };

export interface ResolvedNavLink {
  label: string;
  href?: string;
  openInNewTab?: boolean;
}

export type ResolvedNavItem =
  | { type: "link"; label: string; link: ResolvedNavLink }
  | {
      type: "column";
      label: string;
      items: ResolvedNavbarColumnChild[];
    }
  | {
      type: "card";
      label: string;
      description?: string;
      imageUrl?: string;
      icon?: IconProps;
      link: ResolvedNavLink;
    }
  | {
      type: "cta";
      label: string;
      link: ResolvedNavLink;
      variant?: NavbarCtaVariant;
    };

/**
 * Authored navigation style, per breakpoint.
 *
 * Both values are raw CSS values (the shared `ValueUnitInput` writes things
 * like `0.875rem` or `12px`). Empty is meaningful: it keeps the stylesheet
 * defaults, so a document authored before this field renders unchanged.
 */
export type NavbarAppearanceProps = {
  /** Size of every link label, not of card copy or the CTA. */
  fontSize?: string;
  /** Gap between the desktop top-level entries and the mobile sheet rows. */
  itemSpacing?: string;
};

/** Authored content of the NavbarBlock, grouped in one editor section. */
export type NavbarBlockContent = {
  /** Ordered top-level menu items. */
  items?: NavItem[];
  /** Desktop presentation. Mobile always uses the sheet/accordion layout. */
  layout?: NavbarLayout;
  /** Viewport at which the desktop menu becomes the hamburger. */
  collapseAt?: NavbarCollapse;
};

/** Resolved content passed to the pure render. */
export type NavbarBlockRenderContent = {
  items?: NavItemUi[];
  layout?: NavbarLayout;
  collapseAt?: NavbarCollapse;
};

export type NavbarBlockProps = {
  content?: NavbarBlockContent;
  appearance?: Responsive<NavbarAppearanceProps>;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};

/** Inputs accepted by the pure render, before style variables are computed. */
export type NavbarBlockRenderProps = {
  content?: NavbarBlockRenderContent;
  appearance?: Responsive<NavbarAppearanceProps>;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
  /** True inside the editor canvas, where hidden blocks stay selectable. */
  editing?: boolean;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
};

export type NavbarBlockUiProps = {
  items?: NavItemUi[];
  layout?: NavbarLayout;
  collapseAt?: NavbarCollapse;
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
  /** Navigation style variables, repeated on the portaled sheet. */
  appearanceVars?: Record<string, string>;
  /** Editor visibility classes, empty on the public render. */
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
};
