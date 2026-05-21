import Image from "next/image";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  MarkViewRendererProps,
  NodeViewRendererProps,
  NodeViewWrapper,
} from "@tiptap/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useSheet } from "@/app/(admin)/_hooks/use-sheet-store";
import { setImage, unsetImage } from "../helpers";

export const EmbeddedImage = ({
  editor,
  HTMLAttributes,
  node,
  getPos,
}: NodeViewRendererProps) => {
  const { onOpen } = useSheet();

  const onSave = ({ url, altText }: { url: string; altText: string }) => {
    const p = getPos();
    if (p) {
      setImage(editor, p, { url, altText });
    }
  };

  const onHandleEdit = () => {
    onOpen("editContentImage", onSave, {
      image: {
        url: node.attrs.src,
        altText: node.attrs.alt,
      },
    });
  };

  const onHandleRemove = () => {
    const p = getPos();
    if (p) {
      unsetImage(editor, p);
    }
  };

  return (
    <NodeViewWrapper className="react-component">
      <div className="border rounded-md mt-6 mb-4" contentEditable={false}>
        <div className="flex items-center justify-between w-full px-4 py-2 border-b bg-slate-100 dark:bg-secondary">
          <p className="text-muted-foreground  mb-0">Embedded Image</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={onHandleEdit}
              >
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
          <div className="flex-1 text-muted-foreground">{node.attrs.alt}</div>
          <div className="relative aspect-video w-36 h-36">
            <Image
              alt={node.attrs.alt}
              fill
              className="object-cover rounded-md"
              src={node.attrs.src}
              unoptimized
            />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
