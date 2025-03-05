import Image from "next/image";
import { Transforms } from "slate";
import { ReactEditor, RenderElementProps, useSlateStatic } from "slate-react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { EmbeddedImageElement } from "@/app/(admin)/_components/editor";
import { Button } from "@/components/ui/button";
import { useSheet } from "@/app/(admin)/_hooks/use-sheet-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const onHandleEdit = () => {
    onOpen("editContentImage", onSave, {
      image: { url: element.url, altText: element.altText },
    });
  };

  return (
    <div className="border rounded-md mt-6 mb-4" contentEditable={false}>
      <div className="flex items-center justify-between w-full px-4 py-2 border-b bg-slate-100 dark:bg-secondary">
        <p className="text-muted-foreground text-sm">Embedded Image</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-6 w-6 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem className="cursor-pointer" onClick={onHandleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={onHandleRemove}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full flex items-center justify-between h-40 p-4">
        <div className="flex-1 text-muted-foreground">{element.altText}</div>
        <div className="relative aspect-video w-36 h-36">
          <Image
            alt={element.altText}
            fill
            className="object-cover rounded-md"
            src={element.url}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
};
