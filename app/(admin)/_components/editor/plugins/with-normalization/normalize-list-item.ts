import { Element, Node, NodeEntry, Transforms } from "slate";
import { CustomEditor } from "../..";

const noramlizeListItem = (editor: CustomEditor, entry: NodeEntry) => {
  const [node, path] = entry;

  if (Element.isElement(node) && node.type === "list-item") {
    // FIX: normalize blockquote children
    const children = Array.from(Node.children(editor, path));
    for (const [child, childPath] of children) {
      if (Element.isElement(child) && !editor.isInline(child)) {
        Transforms.unwrapNodes(editor, { at: childPath });
        return true;
      }
    }
  }
  return false;
};

export default noramlizeListItem;
