import { FormNodeInstance, FormRootInstance } from "../types";

export const findNodeRecursively = (
  node: FormNodeInstance,
  id: string,
): FormNodeInstance | null => {
  if (node.id === id) return node as FormNodeInstance;

  if (node.group === "element" || !node.children) return null;

  for (const child of node.children) {
    const result = findNodeRecursively(child, id);
    if (result) return result;
  }

  return null;
};
