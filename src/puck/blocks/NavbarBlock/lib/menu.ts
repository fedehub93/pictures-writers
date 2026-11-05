import type { LinkProps } from "@/puck/fields/link/types";

import type { NavItem, NavItemType, NavbarMenuLink } from "../types";

/**
 * Prefer the label the editor set on the item, then the link label the
 * resolver filled in (for example from the target entity title).
 */
export function getNavLabel(
  label: string | undefined,
  link?: NavbarMenuLink,
): string {
  return label?.trim() || link?.label?.trim() || "";
}

export function createNavItem(type: NavItemType): NavItem {
  switch (type) {
    case "link":
      return {
        type: "link",
        label: "Link",
        link: { type: "external", url: "" },
      };
    case "column":
      return { type: "column", label: "Column", items: [] };
    case "card":
      return {
        type: "card",
        label: "Card",
        link: { type: "external", url: "" },
      };
    case "cta":
      return {
        type: "cta",
        label: "Action",
        link: { type: "external", url: "" },
        variant: "primary",
      };
  }
}

export function createColumnLink(): { label: string; link: LinkProps } {
  return { label: "", link: { type: "external", url: "" } };
}

export function moveNavItem(
  items: NavItem[],
  index: number,
  direction: -1 | 1,
): NavItem[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  const current = next[index];
  const swap = next[target];
  if (!current || !swap) return items;

  next[index] = swap;
  next[target] = current;
  return next;
}

/**
 * Whether a resolved href points at the current page or one of its children.
 *
 * `trailingSlash` is enabled on the public site, but `usePathname` and stored
 * hrefs can disagree on the trailing slash, so both sides are normalized.
 * External links, query-only paths and missing hrefs are never active.
 */
export function isNavLinkActive(
  pathname: string | null | undefined,
  href: string | undefined,
): boolean {
  if (!pathname || !href) return false;
  if (!href.startsWith("/")) return false;

  const [path] = href.split(/[?#]/);
  const [currentPath] = pathname.split(/[?#]/);
  if (!path || !currentPath) return false;

  if (path === "/") return currentPath === "/";

  const normalizedHref = path.endsWith("/") ? path.slice(0, -1) : path;
  const normalizedPathname =
    currentPath.endsWith("/") && currentPath !== "/"
      ? currentPath.slice(0, -1)
      : currentPath;

  return (
    normalizedPathname === normalizedHref ||
    normalizedPathname.startsWith(`${normalizedHref}/`)
  );
}
