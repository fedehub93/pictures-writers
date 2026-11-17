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
  editing,
  dragRef,
}: LinkListBlockUiProps) => {
  const visibleLinks = links
    .map((item) => item?.link)
    .filter((link): link is LinkProps | LegacyLinkProps =>
      Boolean(link && hasContent(link)),
    );

  return (
    // The column is the block root: it owns the layout classes and the style
    // variables, so the editor's selection ref belongs here.
    <div
      ref={dragRef}
      className={cn(
        "flex w-full flex-col gap-2 puck-dim puck-typo puck-block-root",
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
            <InlineSmartLink link={link} editing={editing} />
          </li>
        ))}
      </ul>
    </div>
  );
};
