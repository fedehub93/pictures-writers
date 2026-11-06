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

import { getNavLabel, isNavLinkActive } from "../lib/menu";
import type { NavItemUi, NavbarLayout } from "../types";
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
        <NavigationMenuTrigger className="bg-transparent">
          {item.label}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className={COLUMN_PANEL_CLASSES[layout]}>
            <NavLinkList
              links={item.items ?? []}
              pathname={pathname}
              className={COLUMN_LIST_CLASSES[layout]}
            />
          </div>
        </NavigationMenuContent>
      </>
    );
  }

  return (
    <>
      <NavigationMenuTrigger className="bg-transparent">
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavbarCard
          label={item.label}
          description={item.description}
          imageUrl={item.imageUrl}
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
        <NavigationMenuList className="gap-1">
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
