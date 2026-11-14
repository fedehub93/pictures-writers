"use client";

import { Icon } from "@/shared/ui/icon-picker";
import type { BlockDragRef } from "@/puck/types";
import {
  getLinkText,
  type LegacyLinkProps,
  type LinkProps,
} from "@/puck/fields/link/types";
import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { cn } from "@/shared/lib/utils";

import type { ButtonContentProps } from "../types";
import {
  BUTTON_ICON_DEFAULT_POSITION,
  BUTTON_ICON_DEFAULT_SPACING,
} from "../constants";

export const ButtonBlockUi = ({
  button,
  styleVars,
  layoutClassName,
  editing,
  dragRef,
}: {
  button?: ButtonContentProps;
  styleVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: the canvas keeps the anchor but cancels its navigation. */
  editing?: boolean;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
}) => {
  const link: LinkProps | LegacyLinkProps | undefined = button?.link;
  const iconName = button?.icon?.name;
  const hasIcon = Boolean(iconName);
  const iconPosition =
    button?.iconPosition ?? BUTTON_ICON_DEFAULT_POSITION;
  const iconSpacing = button?.iconSpacing ?? BUTTON_ICON_DEFAULT_SPACING;

  const text = getLinkText(link);

  /**
   * The icon is decoration: it is one em wide so it follows the block's own
   * Typography, and it is hidden from assistive technology so a screen reader
   * reads the button text once.
   */
  const icon = hasIcon ? (
    <Icon
      name={iconName!}
      aria-hidden="true"
      focusable="false"
      className="size-[1em] shrink-0"
    />
  ) : null;

  /**
   * Only an icon changes the anchor's layout. Without one the anchor keeps the
   * `inline-block` it has always had, so an existing Button renders the same
   * markup. With one it becomes an inline flex row, which the gap separates.
   */
  const iconContent =
    hasIcon && text ? (
      <>
        {iconPosition === "before" ? icon : null}
        {text}
        {iconPosition === "after" ? icon : null}
      </>
    ) : undefined;

  return (
    // The anchor (or the plain-text span) is the block: the ref has to reach it,
    // since there is no wrapper element around the link.
    <InlineSmartLink
      link={link}
      editing={editing}
      dragRef={dragRef}
      className={cn(
        "puck-dim puck-typo puck-deco",
        // The hover state's stylesheet rule is scoped to this class, so it
        // reaches no other block. The rule itself is anchor-scoped on the page
        // and editor-scoped in the canvas: a Button that resolves to text does
        // not answer the pointer, while the canvas still previews the state.
        "puck-button",
        hasIcon ? "inline-flex items-center" : "inline-block",
        "puck-block-root",
        layoutClassName,
      )}
      style={hasIcon ? { ...styleVars, gap: iconSpacing } : styleVars}
    >
      {iconContent}
    </InlineSmartLink>
  );
};
