"use client";
import "client-only";

import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { getLinkHref } from "@/puck/fields/link/types";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
  NavigationMenuTrigger,
} from "@/shared/ui/navigation-menu";

import {
  getNavLabel,
  hasMegaPanelContent,
  isNavLinkActive,
} from "../lib/menu";
import type {
  NavItemUi,
  NavbarColumnChildUi,
  NavbarLayout,
} from "../types";
import { NavbarCard } from "./navbar-card";
import { NavLinkList } from "./nav-link-list";

const COLUMN_PANEL_CLASSES: Record<NavbarLayout, string> = {
  mega: "w-[min(90vw,34rem)] p-3",
  compact: "w-56 p-2",
};

const COLUMN_LIST_CLASSES: Record<NavbarLayout, string> = {
  mega: "grid grid-cols-2 gap-1",
  compact: "flex flex-col",
};

/**
 * Cards reuse the production mega panel: two columns, 125 Tailwind units
 * (31.25rem) from the desktop breakpoint and 150 (37.5rem) from `lg`.
 * The `min()` keeps the panel inside narrow desktop viewports.
 */
const MEGA_PANEL_CARDS_CLASSES =
  "grid w-[min(90vw,31.25rem)] grid-cols-2 gap-3 p-4 lg:w-[min(90vw,37.5rem)]";

/**
 * Mega panel of a `column` item.
 *
 * A mega column whose children carry a description or an icon is promoted to
 * the production grid of cards. Everything else — the compact layout and
 * legacy columns — keeps the plain list of links it rendered before.
 */
export const NavbarDesktopColumnPanel = ({
  items,
  layout,
  pathname,
}: {
  items: NavbarColumnChildUi[];
  layout: NavbarLayout;
  pathname?: string | null;
}) => {
  const showsMegaPanel = layout === "mega" && items.some(hasMegaPanelContent);

  if (showsMegaPanel) {
    return (
      <ul className={MEGA_PANEL_CARDS_CLASSES}>
        {items.map((child, childIndex) => (
          <li key={`${child.label}-${childIndex}`} className="flex">
            <NavbarCard
              label={child.label}
              description={child.description}
              icon={child.icon}
              link={child.link}
              pathname={pathname}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={COLUMN_PANEL_CLASSES[layout]}>
      <NavLinkList
        links={items}
        pathname={pathname}
        className={COLUMN_LIST_CLASSES[layout]}
      />
    </div>
  );
};

function DesktopItem({
  item,
  layout,
  pathname,
}: {
  item: NavItemUi;
  layout: NavbarLayout;
  pathname?: string | null;
}) {
  if (item.type === "link") {
    const active = isNavLinkActive(pathname, getLinkHref(item.link));

    return (
      <InlineSmartLink
        link={item.link}
        className={cn(
          navigationMenuTriggerStyle(),
          "puck-nav-label",
          active && "bg-accent/50 text-primary",
        )}
      >
        {getNavLabel(item.label, item.link)}
      </InlineSmartLink>
    );
  }

  if (item.type === "cta") {
    return (
      <InlineSmartLink
        link={item.link}
        className={cn(
          buttonVariants({
            variant: item.variant === "secondary" ? "secondary" : "default",
            size: "sm",
          }),
          "font-semibold",
        )}
      >
        {getNavLabel(item.label, item.link)}
      </InlineSmartLink>
    );
  }

  if (item.type === "column") {
    return (
      <>
        <NavigationMenuTrigger className="puck-nav-label bg-transparent">
          {item.label}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <NavbarDesktopColumnPanel
            items={item.items ?? []}
            layout={layout}
            pathname={pathname}
          />
        </NavigationMenuContent>
      </>
    );
  }

  return (
    <>
      <NavigationMenuTrigger className="puck-nav-label bg-transparent">
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavbarCard
          label={item.label}
          description={item.description}
          imageUrl={item.imageUrl}
          icon={item.icon}
          link={item.link}
          pathname={pathname}
          className="m-1 w-[min(90vw,20rem)]"
        />
      </NavigationMenuContent>
    </>
  );
}

/**
 * Desktop projection of the navbar tree.
 *
 * `link` and `cta` items render inline; `column` and `card` items open a mega
 * menu panel. Mobile rendering ignores this component entirely.
 */
export const NavbarDesktopMenu = ({
  items = [],
  layout = "compact",
  pathname,
}: {
  items?: NavItemUi[];
  layout?: NavbarLayout;
  pathname?: string | null;
}) => {
  if (items.length === 0) return null;

  return (
    <div className="hidden md:flex">
      <NavigationMenu className="max-w-none" aria-label="Main navigation">
        <NavigationMenuList className="puck-nav-row space-x-0">
          {items.map((item, index) => (
            <NavigationMenuItem key={`${item.type}-${item.label}-${index}`}>
              <DesktopItem item={item} layout={layout} pathname={pathname} />
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};
