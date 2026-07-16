import type { FormNodeDynamicInstance, FormElementInstance } from "../types";

export function getFlatFields(
  nodes: FormNodeDynamicInstance[],
): FormElementInstance[] {
  return nodes.reduce<FormElementInstance[]>((acc, node) => {
    if (node.isContainer) {
      const container = node;
      if (container.children.length) {
        return acc.concat(container.children);
      }
      return acc;
    } else {
      return [...acc, node];
    }
  }, []);
}
