import type { NavbarBlockContent, NavbarLayout } from "./types";

/** Layout choices offered by the Navigation section. */
export const NAVBAR_LAYOUT_ITEMS: { value: NavbarLayout; title: string }[] = [
  { value: "mega", title: "Mega menu" },
  { value: "compact", title: "Compact menu" },
];

/**
 * Default content of a new NavbarBlock.
 *
 * New navbars start in the compact layout so the simpler menu is the default
 * and the mega menu has to be chosen explicitly. The render and the editor
 * control both read this object, so a new block and a stored document agree on
 * the initial layout. Documents saved with the previous flat props are
 * converted by the one-off migration utility; there is no runtime
 * compatibility layer.
 */
export const NAVBAR_BLOCK_DEFAULT_CONTENT = {
  layout: "compact",
  items: [
    {
      type: "link",
      label: "Home",
      link: { type: "external", url: "/" },
    },
  ],
} satisfies NavbarBlockContent;
