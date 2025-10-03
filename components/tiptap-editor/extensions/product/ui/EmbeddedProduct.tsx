import Image from "next/image";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { NodeViewRendererProps, NodeViewWrapper } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const EmbeddedProduct = ({
  editor,
  node,
  getPos,
}: NodeViewRendererProps) => {
  const { productId, productTitle, productImageUrl } = node.attrs as {
    productId: string;
    productTitle: string;
    productImageUrl: string;
  };

  const onHandleRemove = () => {
    const position = getPos();
    if (position) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: position, to: position + node.nodeSize })
        .run();
    }
  };

  return (
    <NodeViewWrapper
      draggable
      className="my-4 border rounded-md shadow-sm bg-white dark:bg-secondary"
      contentEditable={false}
    >
      {/* Header con menu azioni */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-100 dark:bg-secondary">
        <p className="text-muted-foreground text-sm font-medium mb-0">
          Embedded Product
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => {}} className="cursor-pointer">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onHandleRemove}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contenuto prodotto */}
      <div className="flex items-center justify-between p-4 gap-4">
        <div className="flex-1">
          <p className="text-base font-semibold">{productTitle}</p>
          <p className="text-sm text-muted-foreground">ID: {productId}</p>
        </div>
        {productImageUrl && (
          <div className="relative aspect-square w-28 h-28">
            <Image
              draggable={false}
              src={productImageUrl}
              alt={productTitle}
              fill
              className="object-cover rounded-md"
              unoptimized
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
