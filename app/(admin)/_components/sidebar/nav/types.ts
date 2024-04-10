import { LucideIcon } from "lucide-react";

export interface NavProps {
  links: SideLink[];
  isMobile?: boolean;
}

export interface NavLink {
  title: string;
  label?: string;
  href: string;
  icon?: LucideIcon;
}

export interface SideLink extends NavLink {
  sub?: NavLink[];
}

export interface NavLinkProps extends SideLink {
  subLink?: boolean;
}
