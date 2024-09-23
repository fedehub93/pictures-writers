"use client";

import { useSidebar } from "@/store/use-sidebar";

import { NavProps, SideLink } from "./types";
import { NavLink } from "./nav-link";
import { NavLinkDropdown } from "./nav-link-dropdown";
import { NavLinkIcon } from "./nav-link-icon";
import { NavLinkIconDropdown } from "./nav-link-icon-dropdown";
import { Separator } from "@/components/ui/separator";

export const Nav = ({ links, isMobile = false }: NavProps) => {
  const { collapsed } = useSidebar((state) => state);

  const renderLink = ({ sub, ...rest }: SideLink) => {
    const key = `${rest.title}-${rest.href}`;

    if (rest.title === "SEPARATOR") {
      return <Separator />;
    }

    if (collapsed && sub && !isMobile) {
      return <NavLinkIconDropdown {...rest} key={key} sub={sub} />;
    }

    if (collapsed && !isMobile) {
      return <NavLinkIcon {...rest} key={key} sub={sub} />;
    }

    if (sub) {
      return <NavLinkDropdown {...rest} key={key} sub={sub} />;
    }

    return <NavLink {...rest} key={key} />;
  };

  return (
    <div className="py-2">
      <nav className="grid gap-1">{links.map(renderLink)}</nav>
    </div>
  );
};
