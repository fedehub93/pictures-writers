import { ReactEditor, RenderElementProps, useSlateStatic } from "slate-react";

import { EmbeddedVideoElement } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Transforms } from "slate";

interface VideoElementProps extends RenderElementProps {
  element: EmbeddedVideoElement;
}

export const EmbeddedVideo = ({
  attributes,
  children,
  element,
}: VideoElementProps) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const { url } = element;

  const onHandleRemove = () => {
    Transforms.removeNodes(editor, { at: path });
  };
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <div
          style={{
            padding: "75% 0 0 0",
            position: "relative",
          }}
        >
          <iframe
            src={`${url}?title=0&byline=0&portrait=0`}
            frameBorder="0"
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
            }}
          />
          
        </div>

        {/* <UrlInput
          url={url}
          onChange={(val) => {
            const path = ReactEditor.findPath(editor, element);
            const newProperties: Partial<SlateElement> = {
              url: val,
            };
            Transforms.setNodes<SlateElement>(editor, newProperties, {
              at: path,
            });
          }}
        /> */}
      </div>
      {children}
    </div>
  );
};
