import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import {
  getLinkHref,
  type LegacyLinkProps,
  type LinkProps,
} from "@/puck/fields/link/types";
import { cn } from "@/shared/lib/utils";

import type { LinkListBlockUiProps } from "../types";

function hasContent(link: LinkProps | LegacyLinkProps): boolean {
  return Boolean(getLinkHref(link) || link.label?.trim());
}

export const LinkListBlockUi = ({
  title,
  links = [],
  styleVars,
  layoutClassName,
}: LinkListBlockUiProps) => {
  const visibleLinks = links
    .map((item) => item?.link)
    .filter((link): link is LinkProps | LegacyLinkProps =>
      Boolean(link && hasContent(link)),
    );

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 puck-dim puck-typo",
        layoutClassName,
      )}
      style={styleVars}
    >
      {title?.trim() ? (
        <h2 className="font-semibold">{title}</h2>
      ) : null}
      <ul className="flex flex-col gap-1">
        {visibleLinks.map((link, index) => (
          <li key={index}>
            <InlineSmartLink link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
};
