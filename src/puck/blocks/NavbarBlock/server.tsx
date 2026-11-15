import "server-only";

import { resolveMenuLinks } from "@/modules/site-regions/server/resolve-menu-links";

import type { NavbarBlockProps } from "./types";
import { renderNavbarBlock } from "./render";

/**
 * Server renderer for the NavbarBlock.
 *
 * SmartLink resolution needs the database, so the public header resolves the
 * menu tree here and hands the client navigation a plain `{ label, href }`
 * tree. The editor config in `./index.tsx` stays database-free; both sides
 * share the same render function in `./render.tsx`.
 */
export const NavbarBlockServer = async ({
  content,
  appearance,
  layout,
  size,
  spacing,
  decoration,
}: NavbarBlockProps) => {
  const resolvedItems = await resolveMenuLinks(content?.items);

  return renderNavbarBlock({
    content: { ...content, items: resolvedItems },
    appearance,
    layout,
    size,
    spacing,
    decoration,
  });
};
