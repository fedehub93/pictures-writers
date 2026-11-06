"use client";

import type {
  LegacyLinkProps,
  LinkProps,
} from "@/puck/fields/link/types";
import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";

export const LinkBlockUi = ({
  link,
  styleVars,
}: {
  link?: LinkProps | LegacyLinkProps;
  styleVars: Record<string, string>;
}) => {
  return (
    <div className="w-full">
      <InlineSmartLink
        link={link}
        className="puck-dim puck-typo puck-deco inline-block"
        style={styleVars}
      />
    </div>
  );
};
