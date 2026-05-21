import { Element, Node, NodeEntry, Transforms } from "slate";
import { CustomEditor } from "../..";

const noramlizeList = (editor: CustomEditor, entry: NodeEntry) => {
  const [node, path] = entry;

  // Se il nodo è una 'unordered-list' o 'ordered-list'
  if (
    Element.isElement(node) &&
    (node.type === "unordered-list" || node.type === "ordered-list")
  ) {
    // Itera sui figli della lista

    const children = Array.from(Node.children(editor, path));

    for (const [child, childPath] of children) {
      // Se il figlio non è un 'list-item', lo unwrappiamo fuori dalla lista
      if (Element.isElement(child) && child.type !== "list-item") {
        // LiftNodes e sposto i nodi direttamento a livello superiore
        Transforms.liftNodes(editor, {
          at: childPath,
          match: (n) => Element.isElement(n) && n.type === child.type, // Corrisponde al tipo del nodo figlio non valido
        });
        return true;
      }
    }
  }
  return false;
};

export default noramlizeList;
