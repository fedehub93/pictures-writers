import { Element, Text } from "slate";
import { RenderElementProps, useSlate } from "slate-react";
import { useState } from "react";

import { Copy, Pencil, Trash2 } from "lucide-react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomEditorHelper } from "../../utils/custom-editor";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import toast from "react-hot-toast";
import { isCustomText } from "../..";

interface LinkProps extends RenderElementProps {}

export const Link = ({ attributes, children, element }: LinkProps) => {
  const editor = useSlate();

  const { onOpen } = useModal();

  const isActive = CustomEditorHelper.isBlockActive(editor, "hyperlink");

  const onSave = (values: { text: string; target: string }) => {
    if (!isActive) {
      if (!values.target) return;
      CustomEditorHelper.wrapLink(editor, values.target, values.text);
      return;
    }

    CustomEditorHelper.unwrapLink(editor);
  };

  const onCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(element.data.uri)
        .then(() => {
          toast.success("Link copied successfully");
        })
        .catch((err) => {
          toast.error("Failed to copy link");
        });
    } else {
      toast.error("Clipboard API not supported");
    }
  };

  const onEditLink = () => {
    const firstChild = element.children[0];

    if (isCustomText(firstChild)) {
      onOpen("editLink", onSave, {
        text: firstChild.text,
        target: element.data.uri,
      });
    }
  };

  const onRemoveLink = () => {
    const isLink = CustomEditorHelper.isLink(editor);
    if (isLink) {
      CustomEditorHelper.unwrapLink(editor);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <a
          href={element.data.uri}
          className="text-blue-700 underline underline-offset-2 cursor-pointer"
        >
          {children}
        </a>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="border border-gray-300 shadow-lg px-4 py-0.5 bg-white rounded-md w-full"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium leading-none text-blue-700 underline underline-offset-2 cursor-default">
            {element.data.uri}
          </p>
          <div className="ml-8 flex">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="ghost" size="icon" onClick={onCopyLink}>
                      <Copy className="h-4 w-4 pointer-events-none" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="bg-muted-foreground text-muted"
                >
                  <p>Copy Link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="ghost" size="icon" onClick={onEditLink}>
                      <Pencil className="h-4 w-4 pointer-events-none" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="bg-muted-foreground text-muted"
                >
                  <p>Edit Link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="ghost" size="icon" onClick={onRemoveLink}>
                      <Trash2 className="h-4 w-4 pointer-events-none" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="bg-muted-foreground text-muted"
                >
                  <p>Remove Link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
