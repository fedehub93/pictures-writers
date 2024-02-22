import { useCallback } from "react";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
} from "slate-react";
import { DefaultElement } from "@/components/editor/elements/default-element";
import { cn } from "@/lib/utils";
import { Editor, Element, Transforms, Range } from "slate";
import { CustomEditorHelper } from "../utils/custom-editor";
import { HeadingOneElement } from "../elements/heading-one-element";

interface EditorInputProps {}

const EditorInput = () => {
  const editor = useSlate();

  const renderElement = useCallback((props: RenderElementProps) => {
    const { selection } = editor;
    if (!selection) {
      return <DefaultElement {...props} />;
    }

    // Find path of the element and compare with current element
    const path = ReactEditor.findPath(editor, props.element);
    const currentPath = selection.anchor.path;
    const isHighlight = path[0] === currentPath[0];

    switch (props.element.type) {
      case "heading-one":
        return <HeadingOneElement {...props} />;
      default:
        return <DefaultElement {...props} isHighlight={isHighlight} />;
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
      className="border border-t-0 rounded-b-md outline-none min-h-40 p-4"
      renderElement={renderElement}
      renderLeaf={renderLeaf}
    />
  );
};

export default EditorInput;
