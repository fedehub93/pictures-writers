"use client";
import "client-only";

import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { getLinkHref } from "@/puck/fields/link/types";
import { cn } from "@/shared/lib/utils";

import { getNavLabel, isNavLinkActive } from "../lib/menu";
import type { NavbarMenuLink } from "../types";

/**
 * Rich card used by the desktop mega menu and the mobile sheet. The whole card
 * is the link, so a broken/unresolved entity degrades to a non-clickable card
 * that still shows the configured copy.
 */
export const NavbarCard = ({
  label,
  description,
  imageUrl,
  link,
  pathname,
  className,
  onNavigate,
}: {
  label: string;
  description?: string;
  imageUrl?: string;
  link?: NavbarMenuLink;
  pathname?: string | null;
  className?: string;
  onNavigate?: () => void;
}) => {
  const active = isNavLinkActive(pathname, getLinkHref(link));
  const displayLabel = getNavLabel(label, link);

  return (
    <InlineSmartLink
      link={link}
      onClick={onNavigate}
      className={cn(
        "block overflow-hidden rounded-md border bg-background text-left transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
        className,
      )}
    >
      {imageUrl ? (
        // Arbitrary customer URLs cannot go through the media loader; the
        // Image block uses the same plain <img> approach.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="h-32 w-full object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-1 p-3">
        <span className="text-sm font-semibold">{displayLabel}</span>
        {description?.trim() ? (
          <span className="text-sm leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>
    </InlineSmartLink>
  );
};
