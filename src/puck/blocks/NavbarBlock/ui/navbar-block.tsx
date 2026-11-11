"use client";
import "client-only";

import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";

import type { NavbarBlockUiProps } from "../types";
import { NavbarDesktopMenu } from "./desktop-menu";
import { NavbarMobileMenu } from "./mobile-menu";

/**
 * Responsive navigation block.
 *
 * The same typed tree is projected twice: a NavigationMenu mega menu on
 * desktop and a Sheet with Accordion sections on mobile. `usePathname` is read
 * once here so the presentational projections stay easy to test.
 */
export const NavbarBlockUi = ({
  items = [],
  layout = "compact",
  collapseAt = "tablet",
  styleVars,
  appearanceVars,
  layoutClassName,
  dragRef,
}: NavbarBlockUiProps) => {
  const pathname = usePathname();

  if (items.length === 0) return null;

  return (
    // The navigation root is the block root: the desktop menu and the mobile
    // sheet handle live inside it, not around it.
    <div
      ref={dragRef}
      className={cn("puck-dim puck-deco puck-nav puck-block-root", layoutClassName)}
      style={styleVars}
    >
      <NavbarDesktopMenu
        items={items}
        layout={layout}
        collapseAt={collapseAt}
        pathname={pathname}
      />
      <NavbarMobileMenu
        items={items}
        collapseAt={collapseAt}
        pathname={pathname}
        appearanceVars={appearanceVars}
      />
    </div>
  );
};
