import { useCallback } from "react";
import { Editable, RenderElementProps, RenderLeafProps } from "slate-react";
import { DefaultElement } from "@/components/editor/elements/default-element";
import { cn } from "@/lib/utils";

interface EditorInputProps {}

const EditorInput = () => {
  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    if (props.leaf.bold) {
      return <strong>{props.children}</strong>;
    }
    return (
      <span
        {...props.attributes}
        className={cn(
          props.leaf.bold && "font-bold",
          props.leaf.italic && "italic",
          props.leaf.underline && "underline",
          props.leaf.left && "text-left",
          props.leaf.center && "text-center"
        )}
      >
        {props.children}
      </span>
    );
  }, []);

  return (
    <Editable
      className="border rounded-md outline-none"
      renderElement={renderElement}
      renderLeaf={renderLeaf}
    />
  );
};

export default EditorInput;
