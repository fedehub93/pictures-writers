import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import {
  getLinkHref,
  type LegacyLinkProps,
  type LinkProps,
} from "@/puck/fields/link/types";

import type { LinkListBlockProps } from "../types";

function hasContent(link: LinkProps | LegacyLinkProps): boolean {
  return Boolean(getLinkHref(link) || link.label?.trim());
}

export const LinkListBlockUi = ({ title, links = [] }: LinkListBlockProps) => {
  const visibleLinks = links
    .map((item) => item?.link)
    .filter((link): link is LinkProps | LegacyLinkProps =>
      Boolean(link && hasContent(link)),
    );

  return (
    <div className="flex w-full flex-col gap-2">
      {title?.trim() ? (
        <h2 className="text-base font-semibold">{title}</h2>
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
