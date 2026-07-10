import { type FormNodeDynamicInstance } from "../types";

import { GROUP_LAYOUT } from "../constants";

/**
 * Recursively searches for a layout node by its ID and adds a new node to its children.
 * Mutates the array in-place using standard array methods.
 */
export function addNodeToChildren(
  children: FormNodeDynamicInstance[],
  parentId: string,
  nodeToAdd: FormNodeDynamicInstance,
  index?: number,
): boolean {
  for (const node of children) {
    if (node.id === parentId && node.group === GROUP_LAYOUT) {
      if (index !== undefined) {
        node.children.splice(index, 0, nodeToAdd);
      } else {
        node.children.push(nodeToAdd);
      }
      return true; // Node added successfully
    }

    if (node.group === GROUP_LAYOUT) {
      // Recursively search in nested layouts
      const added = addNodeToChildren(
        node.children,
        parentId,
        nodeToAdd,
        index,
      );
      if (added) return true;
    }
  }

  return false;
}
