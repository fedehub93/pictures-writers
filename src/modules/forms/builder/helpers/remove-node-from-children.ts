import { GROUP_LAYOUT } from "../constants";
import { type FormNodeDynamicInstance } from "../types";

/**
 * Recursively searches for a node by its ID and removes it from the tree.
 * Mutates the array in-place.
 */
export function removeNodeFromChildren(
  children: FormNodeDynamicInstance[],
  id: string,
): boolean {
  const targetIndex = children.findIndex((node) => node.id === id);

  if (targetIndex !== -1) {
    children.splice(targetIndex, 1);
    return true; // Node removed successfully
  }

  for (const node of children) {
    if (node.group === GROUP_LAYOUT) {
      const removed = removeNodeFromChildren(node.children, id);
      if (removed) return true;
    }
  }

  return false;
}
