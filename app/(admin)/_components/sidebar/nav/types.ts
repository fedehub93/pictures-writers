import { LucideIcon } from "lucide-react";
import type { Route } from "next";

export interface NavProps {
  links: SideLink[];
  isMobile?: boolean;
}

export interface NavLink {
  title: string;
  label?: string;
  href: Route;
  icon?: LucideIcon;
}

export interface SideLink extends NavLink {
  sub?: NavLink[];
}

export interface NavLinkProps extends SideLink {
  subLink?: boolean;
}
