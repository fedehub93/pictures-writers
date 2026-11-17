import type { LinkListBlockContent } from "./types";

/**
 * Default content of a new Link list block.
 *
 * Used by the component defaults and the editor controls. The renderer draws
 * the content exactly as authored, so a saved document never falls back to a
 * title the editor did not store. Documents with the previous flat props are
 * converted by the one-off migration utility; there is no runtime
 * compatibility layer.
 */
export const LINK_LIST_DEFAULT_CONTENT = {
  title: "Links",
  links: [],
} satisfies LinkListBlockContent;
