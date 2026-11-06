"use client";
import "client-only";

import { usePathname } from "next/navigation";

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
  styleVars,
}: NavbarBlockUiProps) => {
  const pathname = usePathname();

  if (items.length === 0) return null;

  return (
    <div className="flex w-full items-center justify-end">
      <div className="puck-dim puck-deco" style={styleVars}>
        <NavbarDesktopMenu items={items} layout={layout} pathname={pathname} />
        <NavbarMobileMenu items={items} pathname={pathname} />
      </div>
    </div>
  );
};
