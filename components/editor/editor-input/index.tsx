import { useCallback } from "react";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
} from "slate-react";

import { cn } from "@/lib/utils";
import { DefaultElement } from "@/components/editor/elements/default-element";
import { HeadingOneElement } from "@/components/editor/elements/heading-one-element";
import { HeadingTwoElement } from "@/components/editor/elements/heading-two-element";
import { HeadingThreeElement } from "@/components/editor/elements/heading-three-element";
import { HeadingFourElement } from "@/components/editor/elements/heading-four-element";
import { BlockquoteElement } from "@/components/editor/elements/blockquote-element";
import { LinkComponent } from "../elements/link-component";
import { Element } from "slate";

interface EditorInputProps {}

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
    />
  );
};

export default EditorInput;
