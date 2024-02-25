import { useCallback } from "react";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
  withReact,
} from "slate-react";

import { cn } from "@/lib/utils";
import { DefaultElement } from "@/components/editor/elements/default-element";
import { HeadingOneElement } from "@/components/editor/elements/heading-one-element";
import { HeadingTwoElement } from "@/components/editor/elements/heading-two-element";
import { HeadingThreeElement } from "@/components/editor/elements/heading-three-element";
import { HeadingFourElement } from "@/components/editor/elements/heading-four-element";
import { BlockquoteElement } from "@/components/editor/elements/blockquote-element";
import { LinkComponent } from "../elements/link-component";
import { Editor, Element, Node, Range, Transforms, createEditor } from "slate";
import { CustomEditor } from "..";
import { isKeyHotkey } from "is-hotkey";

interface EditorInputProps {}

// PLUGIN
const withInlines = (editor: CustomEditor) => {
  const { isInline, normalizeNode } = editor;

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

  return editor;
};

export const createWrappedEditor = () => withInlines(withReact(createEditor()));

const EditorInput = () => {
  const editor = useSlate();

  const renderElement = useCallback((props: RenderElementProps) => {
    const { selection } = editor;
    if (!selection) {
      return <DefaultElement {...props} />;
    }

    // Find path of the element and compare with current element
    // const path = ReactEditor.findPath(editor, props.element);
    // const currentPath = selection.anchor.path;
    // const isHighlight = path[0] === currentPath[0];

    switch (props.element.type) {
      case "heading-one":
        return <HeadingOneElement {...props} />;
      case "heading-two":
        return <HeadingTwoElement {...props} />;
      case "heading-three":
        return <HeadingThreeElement {...props} />;
      case "heading-four":
        return <HeadingFourElement {...props} />;
      case "block-quote":
        return <BlockquoteElement {...props} />;
      case "link":
        return <LinkComponent {...props} />;
      case "list-item":
        return (
          <li {...props.attributes} className="list-item">
            {props.children}
          </li>
        );
      case "bulleted-list":
        return (
          <ul {...props.attributes} className="list-disc">
            {props.children}
          </ul>
        );
      case "numbered-list":
        return (
          <ol {...props.attributes} className="list-decimal">
            {props.children}
          </ol>
        );
      case "code":
        return <div {...props.attributes}>{props.children}</div>;
      default:
        // return <DefaultElement {...props} isHighlight={isHighlight} />;
        return <DefaultElement {...props} />;
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
          console.log(nativeEvent);
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
          if (isKeyHotkey("enter", nativeEvent)) {
            event.preventDefault();
            editor.insertBreak();
            Transforms.splitNodes(editor);
            Transforms.setNodes(editor, {
              type: "paragraph",
              children: [{ text: "" }],
            });
          }
        }
      }}
    />
  );
};

export default EditorInput;
