import type { FormNodeDynamicInstance } from "../types/core";

/**
 * Recursively searches for a node by its ID, removes it from its current position,
 * and returns the extracted node. Mutates the array in-place.
 */
export function extractNodeById(
  children: FormNodeDynamicInstance[],
  id: string,
): FormNodeDynamicInstance | undefined {
  const targetIndex = children.findIndex((node) => node.id === id);

  if (targetIndex !== -1) {
    // Extract and return the node simultaneously
    return children.splice(targetIndex, 1)[0];
  }

  for (const node of children) {
    if (node.isContainer) {
      const extractedNode = extractNodeById(node.children, id);
      if (extractedNode) return extractedNode;
    }
  }

  return undefined;
}
