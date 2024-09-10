import Image from "next/image";
import { Transforms } from "slate";
import { ReactEditor, RenderElementProps, useSlateStatic } from "slate-react";
import { Pencil, Trash2 } from "lucide-react";

import { EmbeddedImageElement } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { useSheet } from "@/app/(admin)/_hooks/use-sheet-store";

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

  const { onOpen } = useSheet();

  const onSave = ({ url, altText }: { url: any; altText: any }) => {
    Transforms.setNodes<EmbeddedImageElement>(
      editor,
      { url, altText },
      { at: path }
    );
  };

  const onHandleRemove = () => {
    Transforms.removeNodes(editor, { at: path });
  };

  console.log(element)

  return (
    <div {...attributes}>
      {children}
      <div
        contentEditable={false}
        className="relative group shadow-md w-full aspect-video mt-2 mb-4"
      >
        <Image
          src={element.url}
          alt={element.altText}
          fill
          className="rounded-md object-cover"
        />
        <div className="h-full w-full opacity-0 group-hover:opacity-50 transition-all duration-700 bg-black rounded-md" />
        <div className="flex flex-col gap-y-4 opacity-0 group-hover:opacity-100 transition-all duration-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Button
            onClick={() =>
              onOpen("editContentImage", onSave, {
                image: { url: element.url, altText: element.altText },
              })
            }
            variant="outline"
            size="sm"
            type="button"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit image
          </Button>
          <Button onClick={onHandleRemove} variant="outline" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove image
          </Button>
        </div>
      </div>
    </div>
  );
};
