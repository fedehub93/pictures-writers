import type {
  LegacyLinkProps,
  LinkProps,
} from "@/puck/fields/link/types";

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

export type NavbarBlockProps = {
  /** Ordered top-level menu items. */
  items?: NavItem[];
  /** Desktop presentation. Mobile always uses the sheet/accordion layout. */
  layout?: NavbarLayout;
};

export type NavbarBlockUiProps = {
  items?: NavItemUi[];
  layout?: NavbarLayout;
};
