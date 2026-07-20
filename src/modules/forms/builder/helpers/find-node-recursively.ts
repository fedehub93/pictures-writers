import type { FormNodeInstance } from "../types/core";

export const findNodeRecursively = (
  node: FormNodeInstance,
  id: string | null,
): FormNodeInstance | null => {
  if (node.id === id) return node;

  if (!node.isContainer || !node.children) return null;

  for (const child of node.children) {
    const result = findNodeRecursively(child, id);
    if (result) return result;
  }

  return null;
};
