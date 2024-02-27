import { useCallback } from "react";
import { Editor, Element, Node, Path, Range, Transforms } from "slate";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
} from "slate-react";
import { isKeyHotkey } from "is-hotkey";

import { cn } from "@/lib/utils";

import { CustomEditor } from "@/components/editor";
import {
  Default,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  HeadingFour,
  Blockquote,
  ListItem,
  BulletedList,
  NumberedList,
  Link,
} from "@/components/editor/editor-input/elements";

const SOFT_BREAK_ELEMENTS = [
  "heading-one",
  "heading-two",
  "heading-three",
  "heading-four",
  "block-quote",
];
// PLUGIN
export const withInlines = (editor: CustomEditor) => {
  const { isInline, normalizeNode, insertBreak, insertSoftBreak } = editor;

  editor.isInline = (element) =>
    element.type === "link" ? true : isInline(element);

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (Element.isElement(node) && node.type === "paragraph") {
      const children = Array.from(Node.children(editor, path));
      for (const [child, childPath] of children) {
        // FIX: remove link nodes whose text value is empty string.
        // FIX: empty text links happen when you move from link to next line or delete link line.
        if (
          Element.isElement(child) &&
          editor.isInline(child) &&
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
          return;
        }
      }
    }
    normalizeNode(entry);
  };

  editor.insertBreak = () => {
    const { selection } = editor;

    if (selection) {
      const [match] = Array.from(
        Editor.nodes(editor, {
          match: (n) =>
            !Editor.isEditor(n) &&
            Element.isElement(n) &&
            n.type === "list-item",
        })
      );

      // If list-item bypass insert break and insert new list-item element

      if (match && Element.isElement(match[0])) {
        const [_, nodePath] = Editor.parent(editor, match[1]);
        const lastNode = Editor.last(editor, nodePath);

        const isLastNode = Path.equals(match[1], [
          lastNode[1][0],
          lastNode[1][1],
        ]);

        const isEmpty = match[0].children[0].text.trim() === "";

        // If empty list-item node and is last then break
        if (isEmpty && isLastNode) {
          editor.removeNodes();
          insertBreak();
          editor.splitNodes();
          editor.setNodes({
            type: "paragraph",
            children: [{ text: "" }],
          });
          editor.liftNodes();
          return;
        } else {
          editor.insertNodes([{ ...match[0], children: [{ text: "" }] }]);
          return;
        }
      }
    }

    insertBreak();

    // DEFAULT ELEMENT
    Transforms.splitNodes(editor);
    Transforms.setNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    });
  };

  editor.insertSoftBreak = () => {
    const { selection } = editor;

    if (selection) {
      const [match] = Array.from(
        Editor.nodes(editor, {
          match: (n) =>
            !Editor.isEditor(n) &&
            Element.isElement(n) &&
            SOFT_BREAK_ELEMENTS.includes(n.type),
        })
      );
      if (match && Element.isElement(match[0])) {
        Transforms.insertText(editor, "\n");
        return;
      }
    }
    insertSoftBreak();
  };

  return editor;
};

interface EditorInputProps {}

const EditorInput = () => {
  const editor = useSlate();

  const renderElement = useCallback((props: RenderElementProps) => {
    // const { selection } = editor;
    // if (!selection) {
    //   return <DefaultElement {...props} />;
    // }

    // Find path of the element and compare with current element
    // const path = ReactEditor.findPath(editor, props.element);
    // const currentPath = selection.anchor.path;
    // const isHighlight = path[0] === currentPath[0];

    switch (props.element.type) {
      case "heading-one":
        return <HeadingOne {...props} />;
      case "heading-two":
        return <HeadingTwo {...props} />;
      case "heading-three":
        return <HeadingThree {...props} />;
      case "heading-four":
        return <HeadingFour {...props} />;
      case "block-quote":
        return <Blockquote {...props} />;
      case "link":
        return <Link {...props} />;
      case "list-item":
        return <ListItem {...props} />;
      case "bulleted-list":
        return <BulletedList {...props} />;
      case "numbered-list":
        return <NumberedList {...props} />;
      case "code":
        return <div {...props.attributes}>{props.children}</div>;
      default:
        // return <DefaultElement {...props} isHighlight={isHighlight} />;
        return <Default {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return (
      <span
        {...props.attributes}
        className={cn(
          props.leaf.bold && "font-bold",
          props.leaf.italic && "italic",
          props.leaf.underline && "underline"
        )}
      >
        {props.children}
      </span>
    );
  }, []);

  return (
    <Editable
      className="border border-t-0 rounded-b-md outline-none h-full p-4"
      renderElement={renderElement}
      renderLeaf={renderLeaf}
      onKeyDown={(event) => {
        const { selection } = editor;

        // Default left/right behavior is unit:'character'.
        // This fails to distinguish between two cursor positions, such as
        // <inline>foo<cursor/></inline> vs <inline>foo</inline><cursor/>.
        // Here we modify the behavior to unit:'offset'.
        // This lets the user step into and out of the inline without stepping over characters.
        // You may wish to customize this further to only use unit:'offset' in specific cases.
        if (selection && Range.isCollapsed(selection)) {
          const { nativeEvent } = event;
          if (isKeyHotkey("left", nativeEvent)) {
            event.preventDefault();
            Transforms.move(editor, { unit: "offset", reverse: true });
            return;
          }
          if (isKeyHotkey("right", nativeEvent)) {
            event.preventDefault();
            Transforms.move(editor, { unit: "offset" });
            return;
          }
        }
      }}
    />
  );
};

export default EditorInput;
