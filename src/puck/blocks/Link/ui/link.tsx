"use client";

import type {
  LegacyLinkProps,
  LinkProps,
} from "@/puck/fields/link/types";
import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { cn } from "@/shared/lib/utils";

export const LinkBlockUi = ({
  link,
  styleVars,
  layoutClassName,
}: {
  link?: LinkProps | LegacyLinkProps;
  styleVars: Record<string, string>;
  layoutClassName?: string;
}) => {
  return (
    <InlineSmartLink
      link={link}
      className={cn(
        "puck-dim puck-typo puck-deco inline-block",
        layoutClassName,
      )}
      style={styleVars}
    />
  );
};
