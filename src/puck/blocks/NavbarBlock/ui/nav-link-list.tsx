"use client";
import "client-only";

import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { getLinkHref } from "@/puck/fields/link/types";
import { cn } from "@/shared/lib/utils";

import { getNavLabel, isNavLinkActive } from "../lib/menu";
import type { NavbarMenuLink } from "../types";

export type NavLinkEntry = {
  label: string;
  link?: NavbarMenuLink;
};

export const NavLinkList = ({
  links,
  pathname,
  onNavigate,
  className,
}: {
  links: NavLinkEntry[];
  pathname?: string | null;
  onNavigate?: () => void;
  className?: string;
}) => {
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex flex-col gap-0.5", className)}>
      {links.map((entry, index) => {
        const active = isNavLinkActive(pathname, getLinkHref(entry.link));
        const label = getNavLabel(entry.label, entry.link);

        return (
          <li key={`${entry.label}-${index}`}>
            <InlineSmartLink
              link={entry.link}
              onClick={onNavigate}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground",
              )}
            >
              {label}
            </InlineSmartLink>
          </li>
        );
      })}
    </ul>
  );
};
