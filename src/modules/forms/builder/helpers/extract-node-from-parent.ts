import { type FormNodeDynamicInstance } from "../types";

/**
 * Recursively searches for a layout node by its ID, extracts a child node at the given index,
 * and returns it. Mutates the array in-place.
 */
export function extractNodeFromParent(
  children: FormNodeDynamicInstance[],
  parentId: string,
  index: number,
): FormNodeDynamicInstance | undefined {
  for (const node of children) {
    if (node.id === parentId && node.isContainer) {
      return node.children.splice(index, 1)[0];
    }

    if (node.isContainer) {
      const extractedNode = extractNodeFromParent(
        node.children,
        parentId,
        index,
      );
      if (extractedNode) return extractedNode;
    }
  }

  return undefined;
}
