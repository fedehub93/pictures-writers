import { Trash2 } from "lucide-react";
import { Transforms } from "slate";
import {
  ReactEditor,
  RenderElementProps,
  useSlateStatic,
} from "slate-react";
import Image from "next/image";


import { Button } from "@/components/ui/button";

import { EmbeddedImageElement } from "@/components/editor";

interface ImageElementProps extends RenderElementProps {
  element: EmbeddedImageElement;
}

export const EmbeddedImage = ({
  attributes,
  children,
  element,
}: ImageElementProps) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);

  // const onHandleEdit = () => {
  //   Transforms.setNodes(editor, { altText: "new" }, { at: path });
  // };

  const onHandleRemove = () => {
    Transforms.removeNodes(editor, { at: path });
  };

  return (
    <div {...attributes}>
      {children}
      <div
        contentEditable={false}
        className="relative group shadow-md w-full aspect-video"
      >
        <Image
          src={element.url}
          alt={element.altText}
          fill
          objectFit="cover"
          className="rounded-md"
        />
        <div className="h-full w-full opacity-0 group-hover:opacity-50 transition-all duration-700 bg-black rounded-md" />
        <div className="flex flex-col gap-y-4 opacity-0 group-hover:opacity-100 transition-all duration-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit image
          </Button> */}
          <Button onClick={onHandleRemove} variant="outline" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove image
          </Button>
        </div>
      </div>
    </div>
  );
};
