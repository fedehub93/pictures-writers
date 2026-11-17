"use client";
import "client-only";

import type { IconProps } from "@/puck/fields/icon";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon-picker";

/**
 * Shared rendering of a menu icon.
 *
 * `DynamicIcon` loads the lucide glyph lazily, so the wrapper is also the only
 * thing present in the server markup; the card and the mobile row use the same
 * wrapper and only differ in size and position.
 */
export const NavbarIcon = ({
  icon,
  className,
}: {
  icon?: IconProps;
  className?: string;
}) => {
  if (!icon?.name) return null;

  return (
    <span
      data-navbar-icon=""
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center text-primary",
        className,
      )}
    >
      <Icon name={icon.name} strokeWidth={1} className="size-full" />
    </span>
  );
};
