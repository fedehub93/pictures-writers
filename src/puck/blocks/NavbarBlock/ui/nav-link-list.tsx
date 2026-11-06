"use client";
import "client-only";

import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { getLinkHref } from "@/puck/fields/link/types";
import { cn } from "@/shared/lib/utils";

import { getNavLabel, isNavLinkActive } from "../lib/menu";
import type { NavbarColumnChildUi, NavbarMenuLink } from "../types";
import { NavbarIcon } from "./navbar-icon";

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

/**
 * Mobile projection of a mega panel column.
 *
 * Unlike the desktop compact list, the sheet shows the panel content: each row
 * carries the icon, the label and the description authored on the column
 * child. Children without panel content still work here, they simply render as
 * a one-line row.
 */
export const NavbarMobileColumnList = ({
  links,
  pathname,
  onNavigate,
  className,
}: {
  links: NavbarColumnChildUi[];
  pathname?: string | null;
  onNavigate?: () => void;
  className?: string;
}) => {
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {links.map((entry, index) => {
        const active = isNavLinkActive(pathname, getLinkHref(entry.link));
        const label = getNavLabel(entry.label, entry.link);

        return (
          <li key={`${label}-${index}`}>
            <InlineSmartLink
              link={entry.link}
              onClick={onNavigate}
              className={cn(
                "flex items-start gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground",
              )}
            >
              <NavbarIcon icon={entry.icon} className="mt-0.5 size-5 shrink-0" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{label}</span>
                {entry.description?.trim() ? (
                  <span className="text-xs leading-snug text-muted-foreground">
                    {entry.description}
                  </span>
                ) : null}
              </span>
            </InlineSmartLink>
          </li>
        );
      })}
    </ul>
  );
};
