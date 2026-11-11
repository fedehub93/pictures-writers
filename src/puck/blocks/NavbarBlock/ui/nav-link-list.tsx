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

/**
 * Plain entry shared by dropdown/column links and the mobile sheet rows.
 *
 * A navigation entry has no surface of its own: hover and the active page only
 * recolour the text, and the keyboard focus ring stays visible.
 */
export const NAV_LINK_PLAIN_CLASSES =
  "puck-nav-label rounded-md px-3 py-2 transition-colors hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring";

export const NavLinkList = ({
  links,
  pathname,
  onNavigate,
  editing,
  className,
}: {
  links: NavLinkEntry[];
  pathname?: string | null;
  onNavigate?: () => void;
  editing?: boolean;
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
              editing={editing}
              className={cn(
                NAV_LINK_PLAIN_CLASSES,
                "block",
                active && "text-primary",
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
  editing,
  className,
}: {
  links: NavbarColumnChildUi[];
  pathname?: string | null;
  onNavigate?: () => void;
  editing?: boolean;
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
              editing={editing}
              className={cn(
                NAV_LINK_PLAIN_CLASSES,
                "flex items-start gap-3",
                active && "text-primary",
              )}
            >
              <NavbarIcon icon={entry.icon} className="mt-0.5 size-5 shrink-0" />
              <span className="flex flex-col gap-0.5">
                <span className="puck-nav-label font-medium">{label}</span>
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
