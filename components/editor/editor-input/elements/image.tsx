import { Trash } from "lucide-react";
import { Transforms } from "slate";
import {
  ReactEditor,
  RenderElementProps,
  useFocused,
  useSelected,
  useSlateStatic,
} from "slate-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

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

  const selected = useSelected();
  const focused = useFocused();
  return (
    <div {...attributes} className="w-full h-full">
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
        />
        <Button
          onClick={() => Transforms.removeNodes(editor, { at: path })}
          variant="ghost"
          size="sm"
          className={cn("absolute top-4 left-4 hidden group-hover:block z-50")}
        >
          <Trash />
        </Button>
      </div>
    </div>
  );
};
