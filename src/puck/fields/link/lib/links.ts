import { normalizeLinkProps, type LinkListItem, type LinkProps } from "../types";

export const EMPTY_LINK: LinkProps = { type: "external", url: "" };

/** The text a list row shows before the author has named the link. */
export const UNTITLED_LINK_LABEL = "Untitled";

/**
 * One empty row of the footer links dialog.
 *
 * The link is cloned so two rows never share the object the author edits.
 */
export function createLinkListItem(): LinkListItem {
  return { link: { ...EMPTY_LINK } };
}

/**
 * The label a list row shows for a link.
 *
 * Legacy `{ label, href }` rows are read through the same normalizer the
 * dialog uses, so a document that predates the SmartLink model still reads.
 */
export function getLinkListItemLabel(item: LinkListItem): string {
  return normalizeLinkProps(item.link)?.label?.trim() || UNTITLED_LINK_LABEL;
}
