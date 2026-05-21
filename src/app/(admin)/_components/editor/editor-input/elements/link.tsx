import { Element, Text, Transforms } from "slate";
import { ReactEditor, RenderElementProps, useSlate } from "slate-react";
import { useState } from "react";

import { ArrowUpRight, Copy, Pencil, Trash2 } from "lucide-react";

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
import { cn } from "@/lib/utils";

interface LinkProps extends RenderElementProps {}

export const Link = ({ attributes, children, element }: LinkProps) => {
  const editor = useSlate();
  const path = ReactEditor.findPath(editor, element);

  const { onOpen } = useModal();

  const onSave = (values: {
    text: string;
    target: string;
    follow: boolean;
  }) => {
    Transforms.setNodes(
      editor,
      {
        data: {
          uri: values.target,
          follow: values.follow,
        },
      },
      { at: path }
    );
    Transforms.insertText(editor, values.text, { at: path });
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
        follow: element.data?.follow,
      });
    }
  };

  const onRemoveLink = () => {
    const isLink = CustomEditorHelper.isLink(editor);
    if (isLink) {
      CustomEditorHelper.unwrapLink(editor);
    }
  };

  const isExternalLink =
    element.data.uri.includes("http://") ||
    element.data.uri.includes("https://");

  const isFollow =
    element.data.follow !== undefined
      ? element.data.follow
      : !isExternalLink
      ? true
      : false;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <a
          href={element.data.uri}
          className={cn(
            "relative text-blue-700 underline underline-offset-2 cursor-pointer",
            isFollow && "mr-4"
          )}
        >
          {isFollow && (
            <ArrowUpRight className="absolute top-0 -right-4 h-4 w-4" />
          )}
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
