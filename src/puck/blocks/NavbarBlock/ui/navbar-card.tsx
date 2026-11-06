"use client";
import "client-only";

import type { IconProps } from "@/puck/fields/icon";
import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { getLinkHref } from "@/puck/fields/link/types";
import { cn } from "@/shared/lib/utils";

import { getNavLabel, isNavLinkActive } from "../lib/menu";
import type { NavbarMenuLink } from "../types";
import { NavbarIcon } from "./navbar-icon";

/**
 * Rich card used by the desktop mega menu (both `card` items and detailed
 * column children) and the mobile sheet. Sharing the presentation keeps a
 * column child and a card from drifting apart.
 *
 * The whole card is the link, so a broken/unresolved entity degrades to a
 * non-clickable card that still shows the configured copy. The icon is
 * decorative and absolutely positioned, matching the production header where
 * it sits at the bottom-right of the card.
 */
export const NavbarCard = ({
  label,
  description,
  imageUrl,
  icon,
  link,
  pathname,
  className,
  onNavigate,
}: {
  label: string;
  description?: string;
  imageUrl?: string;
  icon?: IconProps;
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
        "relative flex h-full w-full flex-col overflow-hidden rounded-md border bg-background text-left transition-colors hover:bg-accent hover:text-accent-foreground",
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
      <div className={cn("flex flex-col gap-1 p-3", icon?.name && "pr-12")}>
        <span className="text-sm font-semibold">{displayLabel}</span>
        {description?.trim() ? (
          <span className="text-sm leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>
      <NavbarIcon icon={icon} className="absolute right-2 bottom-3 size-8" />
    </InlineSmartLink>
  );
};
