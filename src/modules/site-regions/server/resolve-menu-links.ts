import "server-only";

import {
  isSmartLink,
  type LegacyLinkProps,
} from "@/puck/fields/link/types";
import type {
  NavItemUi,
  NavbarColumnChildUi,
  NavbarMenuLink,
  ResolvedNavItem,
  ResolvedNavLink,
  ResolvedNavbarColumnChild,
} from "@/puck/blocks/NavbarBlock/types";

import { resolveSmartLink } from "./resolve-link";

function isResolvedLink(value: NavbarMenuLink): value is LegacyLinkProps {
  return "href" in value;
}

/**
 * Resolve one menu link.
 *
 * The public query already walks Puck data and resolves SmartLinks before the
 * block renders, so this function also accepts the `{ label, href }` shape and
 * leaves it untouched. That keeps `NavbarBlock` usable both behind the cached
 * region query and directly from a server caller.
 */
async function resolveMenuLink(
  link: NavbarMenuLink | undefined,
  fallbackLabel: string,
): Promise<ResolvedNavLink> {
  if (!link) return { label: fallbackLabel, openInNewTab: undefined };

  if (isSmartLink(link)) {
    const label = "label" in link ? link.label : undefined;
    const resolved = await resolveSmartLink({
      ...link,
      label: label?.trim() || fallbackLabel,
    });

    return {
      label: resolved.label || fallbackLabel,
      href: resolved.href ?? undefined,
      openInNewTab: resolved.openInNewTab,
    };
  }

  if (isResolvedLink(link)) {
    return {
      label: link.label?.trim() || fallbackLabel,
      href: link.href?.trim() || undefined,
      openInNewTab: link.openInNewTab,
    };
  }

  return { label: fallbackLabel, openInNewTab: undefined };
}

async function resolveColumnChild(
  child: NavbarColumnChildUi,
): Promise<ResolvedNavbarColumnChild> {
  return {
    label: child.label,
    link: await resolveMenuLink(child.link, child.label),
    description: child.description,
    icon: child.icon,
  };
}

async function resolveMenuItem(item: NavItemUi): Promise<ResolvedNavItem> {
  switch (item.type) {
    case "link":
      return {
        type: "link",
        label: item.label,
        link: await resolveMenuLink(item.link, item.label),
      };

    case "column":
      return {
        type: "column",
        label: item.label,
        items: await Promise.all(
          (item.items ?? []).map(resolveColumnChild),
        ),
      };

    case "card":
      return {
        type: "card",
        label: item.label,
        description: item.description,
        imageUrl: item.imageUrl,
        icon: item.icon,
        link: await resolveMenuLink(item.link, item.label),
      };

    case "cta":
      return {
        type: "cta",
        label: item.label,
        link: await resolveMenuLink(item.link, item.label),
        variant: item.variant,
      };
  }
}

/**
 * Resolve entity references in a `NavbarBlock` menu tree.
 *
 * Runs on the server because SmartLink resolution needs the database. The
 * stored document is not mutated: the renderer receives a fresh tree with
 * concrete hrefs and the configured labels.
 */
export async function resolveMenuLinks(
  items: NavItemUi[] | undefined,
): Promise<ResolvedNavItem[]> {
  if (!items?.length) return [];

  return Promise.all(items.map(resolveMenuItem));
}
