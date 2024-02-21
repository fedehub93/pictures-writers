import { useCallback } from "react";
import { Editable, RenderElementProps, RenderLeafProps } from "slate-react";
import { DefaultElement } from "@/components/editor/elements/default-element";

interface EditorInputProps {}

const EditorInput = () => {
  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <span {...props.attributes}>{props.children}</span>;
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
