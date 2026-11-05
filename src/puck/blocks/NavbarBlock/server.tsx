import "server-only";

import { resolveMenuLinks } from "@/modules/site-regions/server/resolve-menu-links";

import type { NavbarBlockProps } from "./types";
import { NavbarBlockUi } from "./ui/navbar-block";

/**
 * Server renderer for the NavbarBlock.
 *
 * SmartLink resolution needs the database, so the public header resolves the
 * menu tree here and hands the client navigation a plain `{ label, href }`
 * tree. The editor config in `./index.tsx` stays database-free.
 */
export const NavbarBlockServer = async ({ items, layout }: NavbarBlockProps) => {
  const resolvedItems = await resolveMenuLinks(items);

  return <NavbarBlockUi items={resolvedItems} layout={layout} />;
};
