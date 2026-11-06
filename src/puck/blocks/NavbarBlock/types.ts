import type { DecorationProps } from "@/puck/fields/decoration";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { LayoutProps } from "@/puck/fields/layout";
import type {
  LegacyLinkProps,
  LinkProps,
} from "@/puck/fields/link/types";
import type { Responsive } from "@/puck/utils/responsive";

export type NavbarLayout = "mega" | "compact";

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
      items: { label: string; link: LinkProps }[];
    }
  | {
      type: "card";
      label: string;
      description?: string;
      imageUrl?: string;
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
      items?: { label: string; link?: NavbarMenuLink }[];
    }
  | {
      type: "card";
      label: string;
      description?: string;
      imageUrl?: string;
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
      items: { label: string; link: ResolvedNavLink }[];
    }
  | {
      type: "card";
      label: string;
      description?: string;
      imageUrl?: string;
      link: ResolvedNavLink;
    }
  | {
      type: "cta";
      label: string;
      link: ResolvedNavLink;
      variant?: NavbarCtaVariant;
    };

/** Authored content of the NavbarBlock, grouped in one editor section. */
export type NavbarBlockContent = {
  /** Ordered top-level menu items. */
  items?: NavItem[];
  /** Desktop presentation. Mobile always uses the sheet/accordion layout. */
  layout?: NavbarLayout;
};

/** Resolved content passed to the pure render. */
export type NavbarBlockRenderContent = {
  items?: NavItemUi[];
  layout?: NavbarLayout;
};

export type NavbarBlockProps = {
  content?: NavbarBlockContent;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};

/** Inputs accepted by the pure render, before style variables are computed. */
export type NavbarBlockRenderProps = {
  content?: NavbarBlockRenderContent;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
  /** True inside the editor canvas, where hidden blocks stay selectable. */
  editing?: boolean;
};

export type NavbarBlockUiProps = {
  items?: NavItemUi[];
  layout?: NavbarLayout;
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
  /** Editor visibility classes, empty on the public render. */
  layoutClassName?: string;
};
