import type { LinkListItem, LinkProps } from "../types";

export const EMPTY_LINK: LinkProps = { type: "external", url: "" };

/**
 * Item model for the shared inline links editor.
 *
 * The operations are pure so the add, remove, reorder and update behaviour
 * (shared by Link list and Copyright) can be tested without mounting the
 * editor. Every call returns a new array, which keeps Puck's undo/redo and the
 * "save only when dirty" check working as usual.
 */
export function createLinkListItem(): LinkListItem {
  return { link: { ...EMPTY_LINK } };
}

export function updateLinkListItem(
  items: LinkListItem[],
  index: number,
  item: LinkListItem,
): LinkListItem[] {
  return items.map((current, itemIndex) =>
    itemIndex === index ? item : current,
  );
}

export function removeLinkListItem(
  items: LinkListItem[],
  index: number,
): LinkListItem[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function moveLinkListItem(
  items: LinkListItem[],
  index: number,
  direction: -1 | 1,
): LinkListItem[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  const current = next[index];
  const swap = next[target];
  if (!current || !swap) return items;

  next[index] = swap;
  next[target] = current;
  return next;
}
