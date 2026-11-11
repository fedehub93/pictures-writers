"use client";

import type {
  LegacyLinkProps,
  LinkProps,
} from "@/puck/fields/link/types";
import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import type { BlockDragRef } from "@/puck/types";
import { cn } from "@/shared/lib/utils";

export const LinkBlockUi = ({
  link,
  styleVars,
  layoutClassName,
  dragRef,
}: {
  link?: LinkProps | LegacyLinkProps;
  styleVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
}) => {
  return (
    // The anchor (or the plain-text span) is the block: the ref has to reach it,
    // since there is no wrapper element around the link.
    <InlineSmartLink
      link={link}
      dragRef={dragRef}
      className={cn(
        "puck-dim puck-typo puck-deco inline-block",
        layoutClassName,
      )}
      style={styleVars}
    />
  );
};
