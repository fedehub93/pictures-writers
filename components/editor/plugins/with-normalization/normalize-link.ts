import { Element, Node, NodeEntry, Transforms } from "slate";
import { CustomEditor } from "../..";

const normalizeLink = (editor: CustomEditor, entry: NodeEntry) => {
  const [node, path] = entry;

  if (Element.isElement(node) && node.type === "paragraph") {
    const children = Array.from(Node.children(editor, path));

    for (const [child, childPath] of children) {
      // FIX: remove link nodes whose text value is empty string.
      // FIX: empty text links happen when you move from link to next line or delete link line.
      if (
        Element.isElement(child) &&
        editor.isInline(child) &&
        !Element.isElement(child.children[0]) &&
        child.children[0].text === ""
      ) {
        if (children.length === 1) {
          Transforms.removeNodes(editor, { at: path });
          Transforms.insertNodes(editor, {
            type: "paragraph",
            children: [{ text: "" }],
          });
        } else {
          Transforms.removeNodes(editor, { at: childPath });
        }
        return true;
      }

      // FIX: normalize paragrah children
      if (Element.isElement(child) && !editor.isInline(child)) {
        Transforms.unwrapNodes(editor, { at: childPath });
        return true;
      }
    }
  }

  return false;
};

export default normalizeLink;
